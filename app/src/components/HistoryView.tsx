import { useMemo, useState } from 'react'
import { dayKey, fmtQty, macrosFor, round1, summarize, type DaySummary } from '../nutrition'
import type { Goals, Item, LogEntry } from '../types'

interface Props {
  items: Item[]
  logs: LogEntry[]
  goals: Goals
}

const DAYS_SHOWN = 35

function lastNDays(n: number): string[] {
  const out: string[] = []
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  for (let i = 0; i < n; i++) {
    out.push(dayKey(d))
    d.setDate(d.getDate() - 1)
  }
  return out
}

function dayStatus(s: DaySummary | undefined): 'none' | 'hit' | 'partial' | 'miss' {
  if (!s) return 'none'
  if (s.allHit) return 'hit'
  if (s.proteinHit || s.kcalOk) return 'partial'
  return 'miss'
}

export function HistoryView({ items, logs, goals }: Props) {
  const today = dayKey()
  const [selected, setSelected] = useState(today)

  const logsByDay = useMemo(() => {
    const map = new Map<string, LogEntry[]>()
    for (const l of logs) {
      const k = dayKey(l.timestamp)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(l)
    }
    return map
  }, [logs])

  const summaries = useMemo(() => {
    const map = new Map<string, DaySummary>()
    for (const [k, ls] of logsByDay) map.set(k, summarize(items, ls, goals))
    return map
  }, [logsByDay, items, goals])

  const days = lastNDays(DAYS_SHOWN)

  let streak = 0
  for (const [idx, k] of days.entries()) {
    const s = summaries.get(k)
    if (s?.allHit) streak++
    else if (idx === 0) continue
    else break
  }

  const week = days.slice(0, 7).map((k) => summaries.get(k)).filter(Boolean) as DaySummary[]
  const avgProtein = week.length ? week.reduce((a, s) => a + s.protein, 0) / week.length : 0
  const avgKcal = week.length ? week.reduce((a, s) => a + s.kcal, 0) / week.length : 0
  const hitCount = week.filter((s) => s.allHit).length

  const calendar = [...days].reverse()
  const firstDow = new Date(`${calendar[0]}T12:00:00`).getDay()

  const selLogs = [...(logsByDay.get(selected) ?? [])].sort((a, b) => a.timestamp - b.timestamp)
  const selSummary = summaries.get(selected)
  const byId = new Map(items.map((i) => [i.id, i]))

  return (
    <div className="view">
      <section className="stats">
        <div className="stat">
          <div className="stat-value">{streak}</div>
          <div className="stat-label">day streak</div>
        </div>
        <div className="stat">
          <div className="stat-value">{hitCount}/7</div>
          <div className="stat-label">days hit (7d)</div>
        </div>
        <div className="stat">
          <div className="stat-value">{Math.round(avgProtein)}g</div>
          <div className="stat-label">avg protein</div>
        </div>
        <div className="stat">
          <div className="stat-value">{Math.round(avgKcal)}</div>
          <div className="stat-label">avg cal</div>
        </div>
      </section>

      <section className="calendar">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="cal-dow">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDow }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {calendar.map((k) => (
          <button
            key={k}
            className={`cal-day cal-${dayStatus(summaries.get(k))} ${k === selected ? 'cal-sel' : ''} ${
              k === today ? 'cal-today' : ''
            }`}
            onClick={() => setSelected(k)}
          >
            {Number(k.slice(8))}
          </button>
        ))}
      </section>
      <div className="legend">
        <span className="dot cal-hit" /> all hit <span className="dot cal-partial" /> partly
        <span className="dot cal-miss" /> missed <span className="dot cal-none" /> no logs
      </div>

      <h3 className="section-title">
        {new Date(`${selected}T12:00:00`).toLocaleDateString([], {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })}
      </h3>
      {selSummary ? (
        <>
          <p className="day-totals">
            <span className={selSummary.proteinHit ? 'good' : 'bad'}>{round1(selSummary.protein)} g protein</span>
            {' · '}
            <span className={selSummary.kcalOk ? 'good' : 'bad'}>{Math.round(selSummary.kcal)} cal</span>
          </p>
          <ul className="log-list static">
            {selLogs.map((log) => {
              const item = byId.get(log.itemId)
              if (!item) return null
              const m = macrosFor(item, log.qty)
              return (
                <li key={log.id}>
                  <div>
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="log-name">
                      {item.name} <span className="muted">{fmtQty(log.qty, item.unit)}</span>
                    </span>
                    <span className="log-macros">
                      {round1(m.protein)}g · {Math.round(m.kcal)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <p className="muted empty">No logs this day.</p>
      )}
    </div>
  )
}
