import { useMemo } from 'react'
import { LEVELS } from '../data/curriculum'
import { OPEN_MIDI, type StringNo } from '../music/notation'
import { BLOCK_LABEL, buildSession, noteName } from '../practice'
import type { PracticeSession } from '../usePracticeSession'
import { dayKey, streak, type Store } from '../store'
import { DroneButton } from './DroneButton'
import { fingerColor } from './fingers'
import { Fretboard, type Dot } from './Fretboard'
import { ExerciseCard } from './LessonView'

function PentatonicBox({ root }: { root: number }) {
  const rootFret = (((root - OPEN_MIDI[6]) % 12) + 12) % 12
  const dots: Dot[] = []
  for (let s = 1; s <= 6; s++)
    for (let f = rootFret; f <= rootFret + 3; f++) {
      const iv = (((OPEN_MIDI[s as StringNo] + f - root) % 12) + 12) % 12
      if (![0, 3, 5, 7, 10].includes(iv)) continue
      const g = f === 0 ? 0 : rootFret === 0 ? f : f - rootFret + 1
      dots.push({ key: `${s}-${f}`, s, f, label: g === 0 ? 'O' : String(g), color: fingerColor(String(g)), state: iv === 0 ? 'root' : 'normal' })
    }
  return (
    <div>
      <p className="muted small">
        {noteName(root)} minor pentatonic, box 1 — numbers are fretting fingers, white rings are roots.
      </p>
      <Fretboard start={Math.max(0, rootFret - 1)} end={Math.max(0, rootFret - 1) + 5} dots={dots} />
    </div>
  )
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function TimerRing({ elapsed, limit }: { elapsed: number; limit: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  const p = Math.min(1, elapsed / limit)
  const over = elapsed >= limit
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="timer-ring">
      <circle cx="38" cy="38" r={r} className="ring-track" strokeWidth="7" />
      <circle
        cx="38"
        cy="38"
        r={r}
        className={`ring-fill ${over ? 'over' : ''}`}
        strokeWidth="7"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p)}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" className="timer-text">
        {over ? 'done' : fmt(limit - elapsed)}
      </text>
    </svg>
  )
}

const SESSION_LENGTHS = [15, 30, 45, 60]

export function PracticeView({ store, practice, onOpenLesson }: { store: Store; practice: PracticeSession; onOpenLesson: (id: string) => void }) {
  const { state, updateSettings, setLevel } = store
  const today = dayKey()
  const plan = useMemo(() => buildSession(state, today, state.settings.sessionMinutes), [state, today])
  const todayMinutes = state.sessions.find((s) => s.day === today)?.minutes ?? 0
  const days = streak(state, today)
  const { session } = practice

  if (session && !session.finished) {
    const block = session.blocks[session.idx]
    const limit = block.minutes * 60
    const isLast = session.idx === session.blocks.length - 1
    return (
      <div className="view">
        <div className="session-steps">
          {session.blocks.map((b, i) => (
            <button
              key={i}
              className={`step ${i === session.idx ? 'on' : ''} ${session.elapsed[i] >= b.minutes * 60 ? 'done' : ''}`}
              onClick={() => practice.goTo(i)}
              aria-label={BLOCK_LABEL[b.kind]}
            />
          ))}
        </div>
        <div className="card block-card">
          <div className="block-head">
            <div>
              <span className="muted small">
                {session.idx + 1}/{session.blocks.length} · {BLOCK_LABEL[block.kind]}
              </span>
              <h2>{block.title}</h2>
              {block.lesson && (
                <button className="link" onClick={() => onOpenLesson(block.lesson!.id)}>
                  From “{block.lesson.title}” ›
                </button>
              )}
            </div>
            <TimerRing elapsed={session.elapsed[session.idx]} limit={limit} />
          </div>
          {block.lesson && block.kind !== 'improv' && (
            <div className="cues">
              <div>
                <span className="dot" style={{ background: '#4f8cff' }} />
                {block.lesson.leftHand[0]}
              </div>
              <div>
                <span className="dot" style={{ background: '#ffb020' }} />
                {block.lesson.rightHand[0]}
              </div>
            </div>
          )}
          <div className="row">
            <button className="chip" onClick={practice.toggle}>
              {session.running ? '❚❚ Pause timer' : '▶ Resume timer'}
            </button>
            {isLast ? (
              <button className="chip chip-accent" onClick={practice.finish}>
                Finish session
              </button>
            ) : (
              <button className="chip chip-accent" onClick={practice.next}>
                Next block ›
              </button>
            )}
          </div>
        </div>

        {block.exercise && <ExerciseCard key={`${session.idx}-${block.exercise.id}`} ex={block.exercise} store={store} />}
        {block.kind === 'improv' && (
          <div className="card">
            <p>{block.prompt}</p>
            <PentatonicBox root={block.droneRoot ?? 45} />
            <div className="row">
              <DroneButton root={block.droneRoot ?? 45} drive={state.settings.drive} />
            </div>
            <p className="muted small">Tip: record yourself on your phone and listen back for timing and bend pitch.</p>
          </div>
        )}
        <button className="ghost" onClick={practice.finish}>
          End session early
        </button>
      </div>
    )
  }

  if (session?.finished) {
    const secs = session.elapsed.reduce((a, b) => a + b, 0)
    return (
      <div className="view">
        <div className="card done-card">
          <div className="big-emoji" aria-hidden="true">
            🎸
          </div>
          <h2>Session complete</h2>
          <p className="muted">
            {fmt(secs)} practised · {session.elapsed.filter((e) => e > 0).length} blocks · {streak(state, today)}-day streak
          </p>
          <button className="primary" onClick={practice.close}>
            Back to today
          </button>
        </div>
      </div>
    )
  }

  const level = LEVELS.find((l) => l.id === state.level)!
  return (
    <div className="view">
      <div className="stats">
        <div className="stat">
          <b>{days}</b>
          <small>day streak</small>
        </div>
        <div className="stat">
          <b>{todayMinutes}</b>
          <small>min today</small>
        </div>
        <div className="stat">
          <b>{state.completed.length}</b>
          <small>lessons mastered</small>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Today’s practice</h2>
          <select value={state.level} onChange={(e) => setLevel(e.target.value as typeof state.level)} aria-label="Practice level">
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <p className="muted small">{level.tagline}. A fresh routine is generated every day from your level’s lessons.</p>
        <div className="seg">
          {SESSION_LENGTHS.map((m) => (
            <button key={m} className={state.settings.sessionMinutes === m ? 'on' : ''} onClick={() => updateSettings({ sessionMinutes: m })}>
              {m} min
            </button>
          ))}
        </div>
        <ol className="plan">
          {plan.map((b, i) => (
            <li key={i}>
              <span className={`plan-kind k-${b.kind}`}>{BLOCK_LABEL[b.kind]}</span>
              <span className="plan-title">{b.title}</span>
              <span className="muted small">{b.minutes}m</span>
            </li>
          ))}
        </ol>
        <button className="primary" onClick={() => practice.begin(plan)}>
          ▶ Start practice
        </button>
      </div>
    </div>
  )
}
