import { useState } from 'react'
import { CATEGORY_LABEL, LESSONS, LEVELS, type Category, type LevelId } from '../data/curriculum'
import type { Store } from '../store'

const ORDER: Category[] = ['picking', 'fretting', 'lead', 'riff']

export function LearnView({ store, onOpen }: { store: Store; onOpen: (lessonId: string) => void }) {
  const [levelId, setLevelId] = useState<LevelId>(store.state.level)
  const level = LEVELS.find((l) => l.id === levelId)!
  const lessons = LESSONS.filter((l) => l.level === levelId)
  const done = lessons.filter((l) => store.state.completed.includes(l.id)).length

  return (
    <div className="view">
      <div className="level-tabs">
        {LEVELS.map((l, i) => (
          <button key={l.id} className={`level-tab ${l.id === levelId ? 'on' : ''} lvl-${l.id}`} onClick={() => setLevelId(l.id)}>
            <small>{i + 1}</small>
            {l.name}
          </button>
        ))}
      </div>

      <div className={`card level-card lvl-${level.id}`}>
        <div className="card-head">
          <h2>{level.name}</h2>
          <span className="muted small">
            {done}/{lessons.length} mastered
          </span>
        </div>
        <p className="muted">{level.tagline}</p>
        <div className="bar">
          <div style={{ width: `${(done / lessons.length) * 100}%` }} />
        </div>
        <ul className="goals">
          {level.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        {store.state.level !== level.id ? (
          <button className="chip chip-accent" onClick={() => store.setLevel(level.id)}>
            Set as my practice level
          </button>
        ) : (
          <span className="good small">✓ Your daily practice level</span>
        )}
      </div>

      {ORDER.map((cat) => {
        const items = lessons.filter((l) => l.category === cat)
        if (!items.length) return null
        return (
          <div key={cat} className="lesson-group">
            <h3 className="section-title">{CATEGORY_LABEL[cat]}</h3>
            {items.map((l) => {
              const isDone = store.state.completed.includes(l.id)
              return (
                <button key={l.id} className={`lesson-row ${isDone ? 'done' : ''}`} onClick={() => onOpen(l.id)}>
                  <span className={`check ${isDone ? 'on' : ''}`}>{isDone ? '✓' : ''}</span>
                  <span className="lesson-row-text">
                    <b>{l.title}</b>
                    <small>{l.summary}</small>
                  </span>
                  <span className="muted">›</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
