import { useState } from 'react'
import { ALL_EXERCISES, LESSONS, LEVELS } from '../data/curriculum'
import { bestBpm, dayKey, streak, type Store } from '../store'

function Heatmap({ minutesByDay, todayKey }: { minutesByDay: Map<string, number>; todayKey: string }) {
  const weeks = 12
  const today = new Date(`${todayKey}T12:00:00`)
  const start = new Date(today)
  const mondayOffset = (today.getDay() + 6) % 7
  start.setDate(start.getDate() - mondayOffset - (weeks - 1) * 7)
  const cells: { key: string; m: number; future: boolean }[] = []
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = dayKey(d)
    cells.push({ key, m: minutesByDay.get(key) ?? 0, future: d > today })
  }
  const level = (m: number) => (m === 0 ? 0 : m < 15 ? 1 : m < 30 ? 2 : m < 45 ? 3 : 4)
  return (
    <div className="heatmap">
      {cells.map((c) => (
        <span key={c.key} className={`hm hm-${c.future ? 'f' : level(c.m)}`} title={`${c.key}: ${c.m} min`} />
      ))}
    </div>
  )
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 60} ${18 - ((v - min) / (max - min || 1)) * 16}`).join(' ')
  return (
    <svg width="60" height="20" className="spark">
      <polyline points={pts} fill="none" stroke="var(--good)" strokeWidth="1.6" />
    </svg>
  )
}

export function ProgressView({ store }: { store: Store }) {
  const { state } = store
  const [today] = useState(() => dayKey())
  const minutesByDay = new Map(state.sessions.map((s) => [s.day, s.minutes]))
  const total = state.sessions.reduce((a, s) => a + s.minutes, 0)
  const records = ALL_EXERCISES.filter(({ ex }) => state.bpm[ex.id]?.length)

  return (
    <div className="view">
      <div className="stats">
        <div className="stat">
          <b>{streak(state)}</b>
          <small>day streak</small>
        </div>
        <div className="stat">
          <b>{Math.round((total / 60) * 10) / 10}</b>
          <small>hours total</small>
        </div>
        <div className="stat">
          <b>{state.sessions.length}</b>
          <small>practice days</small>
        </div>
      </div>

      <div className="card">
        <h3>Last 12 weeks</h3>
        <Heatmap minutesByDay={minutesByDay} todayKey={today} />
      </div>

      <div className="card">
        <h3>Levels</h3>
        {LEVELS.map((l) => {
          const lessons = LESSONS.filter((x) => x.level === l.id)
          const done = lessons.filter((x) => state.completed.includes(x.id)).length
          return (
            <div key={l.id} className="level-progress">
              <div className="card-head">
                <span>{l.name}</span>
                <span className="muted small">
                  {done}/{lessons.length}
                </span>
              </div>
              <div className={`bar lvl-${l.id}`}>
                <div style={{ width: `${(done / lessons.length) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h3>Clean tempo records</h3>
        {records.length === 0 && <p className="muted small">Tap “Clean at … BPM” on any exercise when you play it cleanly to track your speed.</p>}
        {records.map(({ ex, lesson }) => {
          const best = bestBpm(state, ex.id) ?? 0
          const pct = Math.min(100, ((best - ex.startBpm) / Math.max(1, ex.goalBpm - ex.startBpm)) * 100)
          return (
            <div key={ex.id} className="record">
              <div className="record-text">
                <b>{ex.title}</b>
                <small>{lesson.title}</small>
              </div>
              <Spark values={state.bpm[ex.id].map((e) => e.bpm)} />
              <div className="record-bpm">
                <b className={best >= ex.goalBpm ? 'good' : ''}>{best}</b>
                <small>/ {ex.goalBpm}</small>
              </div>
              <div className="bar thin">
                <div style={{ width: `${Math.max(4, pct)}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <button
        className="ghost"
        onClick={() => {
          if (window.confirm('Reset all progress, streaks and tempo records?')) store.reset()
        }}
      >
        Reset progress
      </button>
    </div>
  )
}
