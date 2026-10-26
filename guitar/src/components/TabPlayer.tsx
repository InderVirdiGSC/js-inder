import { useMemo, useState } from 'react'
import { fretRange, isLegato, type TabEvent } from '../music/notation'
import type { Settings } from '../store'
import { FINGER_NAME, STRING_NAME, fingerColor } from './fingers'
import { Fretboard, type Dot } from './Fretboard'
import { TabView } from './TabView'
import { useTabPlayer } from './useTabPlayer'

function describe(ev: TabEvent): string[] {
  const out: string[] = []
  if (ev.tap) out.push('Tap with the picking hand, then pull off')
  else if (ev.hammer) out.push('Hammer-on — don’t pick')
  else if (ev.pull) out.push('Pull-off — flick the finger down')
  else if (ev.slide) out.push('Slide — keep pressure, don’t pick')
  for (const n of ev.notes) {
    if (n.release) out.push('Release the bend slowly — no pick')
    else if (n.bend) out.push(`Bend ${n.bend === 1 ? '½ step' : n.bend === 2 ? 'a whole step' : n.bend === 3 ? '1½ steps' : `${n.bend} semitones`} (push toward the low E)`)
    if (n.harmonic) out.push('Pinch harmonic — graze with the thumb edge')
  }
  if (ev.vibrato) out.push('Wrist vibrato')
  if (ev.pm) out.push('Palm mute at the bridge')
  if (ev.dead) out.push('Dead note — fret lightly, no pressure')
  return out
}

function PickAnim({ ev, idx }: { ev: TabEvent | undefined; idx: number }) {
  const pick = ev && !isLegato(ev) ? ev.pick : undefined
  const legato = ev && isLegato(ev)
  return (
    <svg viewBox="0 0 90 90" className="pick-anim" aria-hidden="true">
      <line x1="4" x2="86" y1="45" y2="45" className="pa-string" />
      {pick === 'D' || pick === 'U' ? (
        <g key={idx} className={pick === 'D' ? 'pa-down' : 'pa-up'}>
          <path d="M45 30 c-12 0 -16 -8 -16 -14 c0 -8 8 -10 16 -10 c8 0 16 2 16 10 c0 6 -4 14 -16 14z" className="pa-pick" transform="translate(0 6)" />
        </g>
      ) : pick === 'F' ? (
        <g key={idx} className="pa-finger">
          <rect x="38" y="52" width="14" height="30" rx="7" className="pa-fingertip" />
        </g>
      ) : legato ? (
        <text x="45" y="30" textAnchor="middle" className="pa-legato">
          {ev?.tap ? 'TAP' : 'LEGATO'}
        </text>
      ) : null}
      {pick === 'D' && (
        <text x="45" y="86" textAnchor="middle" className="pa-dir">
          ↓ DOWN
        </text>
      )}
      {pick === 'U' && (
        <text x="45" y="86" textAnchor="middle" className="pa-dir">
          ↑ UP
        </text>
      )}
      {pick === 'F' && (
        <text x="45" y="16" textAnchor="middle" className="pa-dir">
          FINGER
        </text>
      )}
    </svg>
  )
}

export function CoachPanel({ ev, idx, playing }: { ev: TabEvent | undefined; idx: number; playing: boolean }) {
  if (!ev || ev.rest)
    return (
      <div className="coach">
        <PickAnim ev={undefined} idx={idx} />
        <div className="coach-body">
          <div className="coach-title">{playing ? 'Rest' : 'Press play'}</div>
          <div className="legend">
            {(['1', '2', '3', '4', 'R'] as const).map((g) => (
              <span key={g}>
                <i style={{ background: fingerColor(g) }}>{g}</i>
                {FINGER_NAME[g]}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  return (
    <div className="coach">
      <PickAnim ev={ev} idx={idx} />
      <div className="coach-body">
        {[...ev.notes]
          .sort((a, b) => a.s - b.s)
          .map((n, i) => (
            <div key={i} className="coach-note">
              <i style={{ background: fingerColor(n.g) }}>{n.g === 0 ? 'O' : n.g}</i>
              <span>
                <b>{FINGER_NAME[String(n.g)]}</b>
                <small>
                  {STRING_NAME[n.s]} string · {n.f === 0 ? 'open' : `fret ${n.f}`}
                </small>
              </span>
            </div>
          ))}
        {describe(ev).map((d) => (
          <div key={d} className="coach-tech">
            {d}
          </div>
        ))}
      </div>
    </div>
  )
}

export interface TabPlayerProps {
  events: TabEvent[]
  startBpm: number
  goalBpm: number
  drive?: boolean
  settings: Settings
  onSettings: (patch: Partial<Settings>) => void
  best?: number
  onLog?: (bpm: number) => void
}

export function TabPlayer({ events, startBpm, goalBpm, drive, settings, onSettings, best, onLog }: TabPlayerProps) {
  const [bpm, setBpm] = useState(best ? Math.min(best, goalBpm) : startBpm)
  const [loop, setLoop] = useState(true)
  const [logged, setLogged] = useState(false)
  const useDrive = !!drive && settings.drive
  const { playing, active, countdown, start, stop } = useTabPlayer(events, {
    bpm,
    loop,
    click: settings.click,
    countIn: settings.countIn,
    drive: useDrive,
  })
  const [start0, end0] = useMemo(() => fretRange(events), [events])
  const current = active >= 0 ? events[active] : undefined

  const dots = useMemo(() => {
    const map = new Map<string, Dot>()
    for (const ev of events)
      for (const n of ev.notes) {
        const key = `${n.s}-${n.f}`
        if (!map.has(key)) map.set(key, { key, s: n.s, f: n.f, label: n.g === 0 ? 'O' : String(n.g), color: fingerColor(n.g), state: 'ghost' })
      }
    if (current)
      for (const n of current.notes) {
        const key = `${n.s}-${n.f}`
        map.delete(key)
        map.set(key, {
          key,
          s: n.s,
          f: n.f,
          label: n.g === 0 ? 'O' : String(n.g),
          color: fingerColor(n.g),
          state: 'active',
          bend: n.bend && !n.release ? n.bend : undefined,
        })
      }
    return [...map.values()]
  }, [events, current])

  const nudge = (d: number) => setBpm((b) => Math.max(30, Math.min(260, b + d)))

  return (
    <div className="player">
      <div className="fb-wrap">
        <Fretboard start={start0} end={end0} dots={dots} />
        {countdown > 0 && <div className="countdown">{countdown}</div>}
      </div>
      <CoachPanel ev={current} idx={active} playing={playing} />
      <TabView events={events} active={active} />
      <div className="controls">
        <button className={`play ${playing ? 'on' : ''}`} onClick={playing ? stop : start} aria-label={playing ? 'Stop' : 'Play'}>
          {playing ? '■' : '▶'}
        </button>
        <div className="tempo">
          <div className="tempo-row">
            <button className="chip" onClick={() => nudge(-5)}>
              −5
            </button>
            <div className="tempo-val">
              <b>{bpm}</b> <small>BPM</small>
            </div>
            <button className="chip" onClick={() => nudge(5)}>
              +5
            </button>
          </div>
          <input
            type="range"
            min={30}
            max={Math.max(goalBpm + 20, 160)}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            aria-label="Tempo"
          />
          <div className="tempo-meta">
            <span>start {startBpm}</span>
            {best ? <span className="good">best {best}</span> : null}
            <span>goal {goalBpm}</span>
          </div>
        </div>
      </div>
      <div className="toggles">
        <button className={`chip ${loop ? 'chip-on' : ''}`} onClick={() => setLoop((l) => !l)}>
          Loop
        </button>
        <button className={`chip ${settings.click ? 'chip-on' : ''}`} onClick={() => onSettings({ click: !settings.click })}>
          Click
        </button>
        <button className={`chip ${settings.countIn ? 'chip-on' : ''}`} onClick={() => onSettings({ countIn: !settings.countIn })}>
          Count-in
        </button>
        {drive && (
          <button className={`chip ${settings.drive ? 'chip-on' : ''}`} onClick={() => onSettings({ drive: !settings.drive })}>
            Distortion
          </button>
        )}
        {onLog && (
          <button
            className="chip chip-accent"
            onClick={() => {
              onLog(bpm)
              setLogged(true)
              window.setTimeout(() => setLogged(false), 1500)
            }}
          >
            {logged ? `Saved ${bpm} ✓` : `Clean at ${bpm}`}
          </button>
        )}
      </div>
    </div>
  )
}
