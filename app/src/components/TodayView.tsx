import { useRef } from 'react'
import { fmtQty, macrosFor, round1, type DaySummary } from '../nutrition'
import type { Goals, Item, LogEntry } from '../types'
import { Ring } from './Ring'

interface Props {
  items: Item[]
  todayLogs: LogEntry[]
  goals: Goals
  summary: DaySummary
  onQuickLog: (item: Item) => void
  onAdjust: (item: Item) => void
  onEditLog: (log: LogEntry) => void
  onLogFixed: (items: Item[]) => void
}

const LONG_PRESS_MS = 450

function ItemTile({
  item,
  todayQty,
  overMax,
  onTap,
  onLongPress,
}: {
  item: Item
  todayQty: number
  overMax: boolean
  onTap: () => void
  onLongPress: () => void
}) {
  const timer = useRef<number | null>(null)
  const fired = useRef(false)

  const start = () => {
    fired.current = false
    timer.current = window.setTimeout(() => {
      fired.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }
  const end = () => {
    const wasPending = timer.current !== null
    cancel()
    if (wasPending && !fired.current) onTap()
  }

  const m = macrosFor(item, item.defaultQty)
  const progress = item.maxQtyPerDay ? Math.min(todayQty / item.maxQtyPerDay, 1) : 0

  return (
    <div className={`tile ${todayQty > 0 ? 'tile-used' : ''} ${overMax ? 'tile-over' : ''}`}>
      <button
        className="tile-main"
        onPointerDown={start}
        onPointerUp={end}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onTap()
          }
        }}
      >
        <span className="tile-name">{item.name}</span>
        <span className="tile-default">{fmtQty(item.defaultQty, item.unit)}</span>
        <span className="tile-macros">
          {round1(m.protein)}g P · {Math.round(m.kcal)} cal
        </span>
        <span className="tile-today">
          {item.maxQtyPerDay
            ? `${fmtQty(todayQty, item.unit)} / ${item.maxQtyPerDay}`
            : todayQty > 0
              ? `Today: ${fmtQty(todayQty, item.unit)}`
              : '\u00a0'}
        </span>
        {item.maxQtyPerDay ? (
          <span className="tile-bar">
            <span style={{ width: `${progress * 100}%` }} />
          </span>
        ) : null}
      </button>
      <button className="tile-adjust" onClick={onLongPress} aria-label={`Adjust ${item.name} amount`}>
        ⋯
      </button>
    </div>
  )
}

export function TodayView({
  items,
  todayLogs,
  goals,
  summary,
  onQuickLog,
  onAdjust,
  onEditLog,
  onLogFixed,
}: Props) {
  const byId = new Map(items.map((i) => [i.id, i]))
  const loggedIds = new Set(todayLogs.map((l) => l.itemId))
  const pendingFixed = items.filter((i) => i.fixedMode === 'confirm' && !loggedIds.has(i.id))

  const proteinLeft = goals.proteinTarget - summary.protein
  const suggestion =
    proteinLeft > 0
      ? items
          .filter((i) => !i.maxQtyPerDay || (summary.qtyByItem[i.id] ?? 0) + i.defaultQty <= i.maxQtyPerDay)
          .map((i) => ({ i, m: macrosFor(i, i.defaultQty) }))
          .filter(({ m }) => summary.kcal + m.kcal <= goals.kcalLimit)
          .sort((a, b) => b.m.protein / b.m.kcal - a.m.protein / a.m.kcal)[0]
      : undefined

  let status: string
  let statusTone: string
  if (summary.allHit) {
    status = 'All goals hit today'
    statusTone = 'good'
  } else if (!summary.kcalOk) {
    status = `Over calorie limit by ${Math.ceil(summary.kcal - goals.kcalLimit)} cal`
    statusTone = 'bad'
  } else if (summary.overMax.length) {
    status = `Over plan: ${summary.overMax.map((id) => byId.get(id)?.name).join(', ')}`
    statusTone = 'bad'
  } else {
    status = `${Math.ceil(proteinLeft)} g protein to go`
    statusTone = 'progress'
  }

  const sortedLogs = [...todayLogs].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="view">
      <section className="rings">
        <Ring label="Protein" value={summary.protein} target={goals.proteinTarget} unit="g" kind="reach" />
        <Ring label="Calories" value={summary.kcal} target={goals.kcalLimit} unit="cal" kind="limit" />
      </section>

      <div className={`status status-${statusTone}`}>
        {status}
        {suggestion && !summary.allHit && summary.kcalOk && (
          <div className="status-hint">
            Try {fmtQty(suggestion.i.defaultQty, suggestion.i.unit)} {suggestion.i.name.toLowerCase()} (+
            {round1(suggestion.m.protein)} g)
          </div>
        )}
      </div>

      {pendingFixed.length > 0 && (
        <button className="fixed-card" onClick={() => onLogFixed(pendingFixed)}>
          <span>Log my fixed items</span>
          <small>{pendingFixed.map((i) => `${i.name} ${fmtQty(i.defaultQty, i.unit)}`).join(' · ')}</small>
        </button>
      )}

      <h3 className="section-title">
        Tap to log default <span className="muted">· hold or ⋯ to change amount</span>
      </h3>
      <section className="grid">
        {items.map((item) => (
          <ItemTile
            key={item.id}
            item={item}
            todayQty={summary.qtyByItem[item.id] ?? 0}
            overMax={summary.overMax.includes(item.id)}
            onTap={() => onQuickLog(item)}
            onLongPress={() => onAdjust(item)}
          />
        ))}
      </section>

      <h3 className="section-title">Today's log</h3>
      {sortedLogs.length === 0 ? (
        <p className="muted empty">Nothing logged yet.</p>
      ) : (
        <ul className="log-list">
          {sortedLogs.map((log) => {
            const item = byId.get(log.itemId)
            if (!item) return null
            const m = macrosFor(item, log.qty)
            return (
              <li key={log.id}>
                <button onClick={() => onEditLog(log)}>
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span className="log-name">
                    {item.name} <span className="muted">{fmtQty(log.qty, item.unit)}</span>
                  </span>
                  <span className="log-macros">
                    {round1(m.protein)}g · {Math.round(m.kcal)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
