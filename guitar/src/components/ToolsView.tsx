import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getAudio, playClick, playNote } from '../music/audio'
import { OPEN_MIDI, type StringNo } from '../music/notation'
import { INTERVAL_NAMES, NOTE_NAMES, SCALES, pitchClass } from '../music/theory'
import type { Store } from '../store'
import { DroneButton } from './DroneButton'
import { Fretboard, type Dot } from './Fretboard'

function Metronome() {
  const [bpm, setBpm] = useState(90)
  const [beats, setBeats] = useState(4)
  const [sub, setSub] = useState(1)
  const [on, setOn] = useState(false)
  const [beat, setBeat] = useState(-1)
  const taps = useRef<number[]>([])
  const cfg = useRef({ bpm, beats, sub })
  useLayoutEffect(() => {
    cfg.current = { bpm, beats, sub }
  })

  useEffect(() => {
    if (!on) return
    const ac = getAudio()
    let next = ac.currentTime + 0.1
    let n = 0
    const queue: { t: number; b: number }[] = []
    const timer = window.setInterval(() => {
      const { bpm: b, beats: bb, sub: s } = cfg.current
      while (next < ac.currentTime + 0.12) {
        const pos = n % s
        const beatIdx = Math.floor(n / s) % bb
        if (pos === 0) {
          playClick(next, beatIdx === 0)
          queue.push({ t: next, b: beatIdx })
        } else playClick(next, false)
        next += 60 / b / s
        n++
      }
    }, 25)
    let raf = 0
    const frame = () => {
      while (queue.length && queue[0].t <= ac.currentTime) setBeat(queue.shift()!.b)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      window.clearInterval(timer)
      cancelAnimationFrame(raf)
      setBeat(-1)
    }
  }, [on])

  const tap = () => {
    const now = performance.now()
    taps.current = [...taps.current.filter((t) => now - t < 2500), now].slice(-6)
    if (taps.current.length >= 2) {
      const gaps = taps.current.slice(1).map((t, i) => t - taps.current[i])
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
      setBpm(Math.max(30, Math.min(260, Math.round(60000 / avg))))
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>Metronome</h2>
        <button className={`chip ${on ? 'chip-on' : ''}`} onClick={() => setOn((v) => !v)}>
          {on ? '■ Stop' : '▶ Start'}
        </button>
      </div>
      <div className="beats">
        {Array.from({ length: beats }, (_, i) => (
          <span key={i} className={`beat ${i === beat ? 'on' : ''} ${i === 0 ? 'accent' : ''}`} />
        ))}
      </div>
      <div className="tempo-row center">
        <button className="chip" onClick={() => setBpm((b) => Math.max(30, b - 5))}>
          −5
        </button>
        <div className="tempo-val big">
          <b>{bpm}</b> <small>BPM</small>
        </div>
        <button className="chip" onClick={() => setBpm((b) => Math.min(260, b + 5))}>
          +5
        </button>
      </div>
      <input type="range" min={30} max={260} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} aria-label="Tempo" />
      <div className="row wrap">
        <div className="seg small-seg">
          {[3, 4, 5, 7].map((b) => (
            <button key={b} className={beats === b ? 'on' : ''} onClick={() => setBeats(b)}>
              {b}/4
            </button>
          ))}
        </div>
        <div className="seg small-seg">
          {[
            [1, '♩'],
            [2, '♫'],
            [3, '3'],
            [4, '16'],
          ].map(([v, l]) => (
            <button key={v} className={sub === v ? 'on' : ''} onClick={() => setSub(v as number)}>
              {l}
            </button>
          ))}
        </div>
        <button className="chip" onClick={tap}>
          Tap tempo
        </button>
      </div>
    </div>
  )
}

function ScaleMap({ drive }: { drive: boolean }) {
  const [root, setRoot] = useState(9)
  const [scaleId, setScaleId] = useState('minpent')
  const [labels, setLabels] = useState<'notes' | 'intervals'>('intervals')
  const scale = SCALES.find((s) => s.id === scaleId)!

  const dots = useMemo(() => {
    const out: Dot[] = []
    for (let s = 1; s <= 6; s++)
      for (let f = 0; f <= 15; f++) {
        const midi = OPEN_MIDI[s as StringNo] + f
        const iv = (pitchClass(midi) - root + 12) % 12
        if (!scale.steps.includes(iv)) continue
        out.push({
          key: `${s}-${f}`,
          s,
          f,
          label: labels === 'notes' ? NOTE_NAMES[pitchClass(midi)].replace('#', '♯') : INTERVAL_NAMES[iv],
          color: iv === 0 ? '#ff5a5f' : iv === 7 ? '#ffb020' : iv === 3 || iv === 4 ? '#34c759' : '#4f8cff',
          state: iv === 0 ? 'root' : 'normal',
          onClick: () => playNote({ time: getAudio().currentTime + 0.01, midi, dur: 0.9, drive }),
        })
      }
    return out
  }, [root, scale, labels, drive])

  return (
    <div className="card">
      <div className="card-head">
        <h2>Scale explorer</h2>
        <DroneButton root={45 + ((root - 9 + 12) % 12)} drive={drive} />
      </div>
      <div className="row wrap">
        <select value={root} onChange={(e) => setRoot(Number(e.target.value))} aria-label="Key">
          {NOTE_NAMES.map((n, i) => (
            <option key={n} value={i}>
              {n}
            </option>
          ))}
        </select>
        <select value={scaleId} onChange={(e) => setScaleId(e.target.value)} aria-label="Scale">
          {SCALES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="seg small-seg">
          <button className={labels === 'intervals' ? 'on' : ''} onClick={() => setLabels('intervals')}>
            Intervals
          </button>
          <button className={labels === 'notes' ? 'on' : ''} onClick={() => setLabels('notes')}>
            Notes
          </button>
        </div>
      </div>
      <p className="muted small">{scale.use} Tap any dot to hear it. Red = root, green = 3rd, amber = 5th.</p>
      <div className="fb-scroll">
        <div className="fb-wide">
          <Fretboard start={0} end={15} dots={dots} />
        </div>
      </div>
    </div>
  )
}

export function ToolsView({ store }: { store: Store }) {
  return (
    <div className="view">
      <Metronome />
      <ScaleMap drive={store.state.settings.drive} />
    </div>
  )
}
