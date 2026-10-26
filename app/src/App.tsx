import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { askNutrition, useAiSettings, type ChatMessage, type FoodSuggestion } from './ai'
import { AskView } from './components/AskView'
import { GoalsView } from './components/GoalsView'
import { HistoryView } from './components/HistoryView'
import { ItemEditor, ItemsView } from './components/ItemsView'
import { QuantitySheet } from './components/QuantitySheet'
import { TodayView } from './components/TodayView'
import { dayKey, fmtQty, macrosFor, round1, summarize } from './nutrition'
import { SEED_STATE } from './seed'
import { newId, useAppState } from './store'
import type { Item, LogEntry } from './types'

type Tab = 'today' | 'ask' | 'history' | 'items' | 'goals'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'ask', label: 'Ask' },
  { id: 'history', label: 'History' },
  { id: 'items', label: 'Items' },
  { id: 'goals', label: 'Goals' },
]

interface Toast {
  message: string
  logIds: string[]
}

type Sheet = { kind: 'new'; item: Item } | { kind: 'edit'; item: Item; log: LogEntry }

export default function App() {
  const { state, addLogs, updateLog, removeLog, upsertItem, removeItem, setGoals, markAutoLogged, replaceState } =
    useAppState()
  const [tab, setTab] = useState<Tab>('today')
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<number | null>(null)
  const [today, setToday] = useState(dayKey())
  const [ai, setAi] = useAiSettings()
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [asking, setAsking] = useState(false)
  const [newFood, setNewFood] = useState<Item | null>(null)

  useEffect(() => {
    const refresh = () => setToday(dayKey())
    const id = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  const showToast = useCallback((message: string, logIds: string[] = []) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ message, logIds })
    toastTimer.current = window.setTimeout(() => setToast(null), 4500)
  }, [])

  const logItems = useCallback(
    (items: Item[], qtys?: number[]) => {
      const now = Date.now()
      const created = addLogs(items.map((it, i) => ({ itemId: it.id, qty: qtys?.[i] ?? it.defaultQty, timestamp: now })))
      const label =
        items.length === 1
          ? `Logged ${fmtQty(created[0].qty, items[0].unit)} ${items[0].name.toLowerCase()}`
          : `Logged ${items.length} items`
      showToast(label, created.map((c) => c.id))
      return created
    },
    [addLogs, showToast],
  )

  const handledDeepLink = useRef(false)
  useEffect(() => {
    if (handledDeepLink.current) return
    handledDeepLink.current = true
    const params = new URLSearchParams(window.location.search)
    const id = params.get('log')
    if (!id) return
    window.history.replaceState(null, '', window.location.pathname)
    const item = state.items.find((i) => i.id === id)
    if (item) logItems([item])
    else showToast(`No item called "${id}"`)
  }, [state.items, logItems, showToast])

  const autoLoggedFor = useRef<string | null>(null)
  useEffect(() => {
    if (state.autoLoggedDays.includes(today) || autoLoggedFor.current === today) return
    autoLoggedFor.current = today
    markAutoLogged(today)
    const loggedToday = new Set(state.logs.filter((l) => dayKey(l.timestamp) === today).map((l) => l.itemId))
    const auto = state.items.filter((i) => i.fixedMode === 'auto' && !loggedToday.has(i.id))
    if (auto.length) logItems(auto)
  }, [today, state.autoLoggedDays, state.items, state.logs, markAutoLogged, logItems])

  const todayLogs = useMemo(() => state.logs.filter((l) => dayKey(l.timestamp) === today), [state.logs, today])
  const summary = useMemo(() => summarize(state.items, todayLogs, state.goals), [state.items, todayLogs, state.goals])

  const logLink = useCallback(
    (itemId: string) => `${window.location.origin}${window.location.pathname}?log=${encodeURIComponent(itemId)}`,
    [],
  )

  const aiContext = () => {
    const items = state.items
      .map((i) => {
        const m = macrosFor(i, i.defaultQty)
        return `- ${i.name}${i.brand ? ` (${i.brand})` : ''}: ${i.proteinPerBasis} g protein, ${i.kcalPerBasis} kcal per ${fmtQty(i.basisQty, i.unit)}; usual ${fmtQty(i.defaultQty, i.unit)} = ${round1(m.protein)} g protein, ${Math.round(m.kcal)} kcal`
      })
      .join('\n')
    return `Daily goals: ${state.goals.proteinTarget} g protein, max ${state.goals.kcalLimit} kcal.
Eaten so far today: ${round1(summary.protein)} g protein, ${Math.round(summary.kcal)} kcal.
The user's items:
${items}`
  }

  const ask = async (text: string, image?: string) => {
    const userMsg: ChatMessage = { id: newId(), role: 'user', text, image }
    const history = [...chat, userMsg]
    setChat(history)
    setAsking(true)
    try {
      const { reply, foods } = await askNutrition(history, ai, aiContext())
      setChat((c) => [...c, { id: newId(), role: 'assistant', text: reply, foods }])
    } catch (err) {
      setChat((c) => [...c, { id: newId(), role: 'assistant', text: (err as Error).message, error: true }])
    } finally {
      setAsking(false)
    }
  }

  const foodToItem = (f: FoodSuggestion): Item => {
    const countable = f.unit === 'piece' || f.unit === 'scoop' || f.unit === 'serving'
    return {
      id: '',
      name: f.name,
      brand: f.brand ?? undefined,
      unit: f.unit,
      basisQty: f.basisQty,
      proteinPerBasis: f.protein,
      kcalPerBasis: f.kcal,
      defaultQty: f.basisQty,
      step: countable ? (f.unit === 'piece' ? 1 : 0.5) : f.unit === 'ml' ? 25 : 5,
      fixedMode: 'off',
      estimated: f.fromLabel ? undefined : true,
      note: f.fromLabel ? undefined : 'Estimated by AI. Check against the label.',
    }
  }

  const undo = () => {
    toast?.logIds.forEach(removeLog)
    setToast(null)
  }

  const editFromToast = () => {
    const log = state.logs.find((l) => l.id === toast?.logIds[0])
    const item = log && state.items.find((i) => i.id === log.itemId)
    if (log && item) setSheet({ kind: 'edit', item, log })
    setToast(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>{TABS.find((t) => t.id === tab)?.label}</h1>
        {tab === 'today' && (
          <span className="muted">
            {new Date(`${today}T12:00:00`).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        )}
      </header>

      <main>
        {tab === 'today' && (
          <TodayView
            items={state.items}
            todayLogs={todayLogs}
            goals={state.goals}
            summary={summary}
            onQuickLog={(item) => logItems([item])}
            onAdjust={(item) => setSheet({ kind: 'new', item })}
            onEditLog={(log) => {
              const item = state.items.find((i) => i.id === log.itemId)
              if (item) setSheet({ kind: 'edit', item, log })
            }}
            onLogFixed={(items) => logItems(items)}
          />
        )}
        {tab === 'ask' && (
          <AskView
            messages={chat}
            busy={asking}
            hasKey={ai.apiKey !== ''}
            onSend={ask}
            onAddFood={(f) => setNewFood(foodToItem(f))}
            onClear={() => setChat([])}
            onOpenSettings={() => setTab('goals')}
          />
        )}
        {tab === 'history' && <HistoryView items={state.items} logs={state.logs} goals={state.goals} />}
        {tab === 'items' && (
          <ItemsView items={state.items} onSave={upsertItem} onDelete={removeItem} logLink={logLink} />
        )}
        {tab === 'goals' && (
          <GoalsView
            key={`${state.goals.proteinTarget}-${state.goals.kcalLimit}`}
            state={state}
            ai={ai}
            onSaveAi={setAi}
            onSaveGoals={setGoals}
            onImport={replaceState}
            onReset={() => replaceState({ ...SEED_STATE, autoLoggedDays: [today] })}
            logLink={logLink}
          />
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.logIds.length > 0 && (
            <>
              <button onClick={undo}>Undo</button>
              {toast.logIds.length === 1 && <button onClick={editFromToast}>Edit</button>}
            </>
          )}
        </div>
      )}

      {sheet && (
        <QuantitySheet
          key={sheet.kind === 'edit' ? sheet.log.id : sheet.item.id}
          item={sheet.item}
          initialQty={sheet.kind === 'edit' ? sheet.log.qty : sheet.item.defaultQty}
          mode={sheet.kind}
          onClose={() => setSheet(null)}
          onDelete={
            sheet.kind === 'edit'
              ? () => {
                  removeLog(sheet.log.id)
                  setSheet(null)
                }
              : undefined
          }
          onSubmit={(qty, saveAsDefault) => {
            if (sheet.kind === 'edit') {
              updateLog(sheet.log.id, qty)
            } else {
              if (saveAsDefault) upsertItem({ ...sheet.item, defaultQty: qty })
              logItems([sheet.item], [qty])
            }
            setSheet(null)
          }}
        />
      )}

      {newFood && (
        <ItemEditor
          initial={newFood}
          existingIds={state.items.map((i) => i.id)}
          logLink={logLink}
          onClose={() => setNewFood(null)}
          onSave={(item) => {
            upsertItem(item)
            setNewFood(null)
            showToast(`Added ${item.name} to your items`)
          }}
        />
      )}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
