/*
 * Compact tab notation used by every exercise.
 *
 *   @16          set note length (1, 2, 4, 8, 16, 12 = 8th triplet, 24 = 16th triplet; append "." for dotted)
 *   S:F:G        string (1 = high E … 6 = low E), fret, fretting finger (0 open, 1–4, T thumb, R picking-hand tap)
 *   a+b          notes struck together (chord / double stop)
 *   -            rest      |  bar line
 *
 * Note flags (suffix): D down-pick, U up-pick, F pluck with a picking-hand finger (hybrid),
 *   h hammer-on, p pull-off, s slide into, t tap, b1/b2/b3 bend (semitones), r release a bend,
 *   ~ vibrato, m palm mute, x dead note, * pinch harmonic.
 */

export type StringNo = 1 | 2 | 3 | 4 | 5 | 6
export type Finger = 0 | 1 | 2 | 3 | 4 | 'T' | 'R'
export type Pick = 'D' | 'U' | 'F'
export type PickingMode = 'alt' | 'down' | 'economy' | 'grid' | 'none'

export interface Note {
  s: StringNo
  f: number
  g: Finger
  bend?: number
  release?: boolean
  harmonic?: boolean
}

export interface TabEvent {
  notes: Note[]
  start: number
  dur: number
  pick?: Pick
  explicitPick?: boolean
  hammer?: boolean
  pull?: boolean
  slide?: boolean
  tap?: boolean
  vibrato?: boolean
  pm?: boolean
  dead?: boolean
  barBefore?: boolean
  rest?: boolean
}

export const OPEN_MIDI: Record<StringNo, number> = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 }

export function midiOf(n: Note): number {
  return OPEN_MIDI[n.s] + n.f
}

const NOTE_RE = /^([1-6]):(\d{1,2}):([0-4TR])(.*)$/

function parseNote(src: string, ev: TabEvent): Note {
  const m = NOTE_RE.exec(src)
  if (!m) throw new Error(`Bad note "${src}"`)
  const g = m[3] === 'T' || m[3] === 'R' ? m[3] : (Number(m[3]) as Finger)
  const note: Note = { s: Number(m[1]) as StringNo, f: Number(m[2]), g }
  const flags = m[4]
  for (let i = 0; i < flags.length; i++) {
    const c = flags[i]
    switch (c) {
      case 'D':
      case 'U':
      case 'F':
        ev.pick = c
        ev.explicitPick = true
        break
      case 'h':
        ev.hammer = true
        break
      case 'p':
        ev.pull = true
        break
      case 's':
        ev.slide = true
        break
      case 't':
        ev.tap = true
        break
      case 'b': {
        const amt = Number(flags[i + 1])
        if (amt >= 1 && amt <= 4) {
          note.bend = amt
          i++
        } else note.bend = 2
        break
      }
      case 'r':
        note.release = true
        if (!note.bend) note.bend = 2
        break
      case '~':
        ev.vibrato = true
        break
      case 'm':
        ev.pm = true
        break
      case 'x':
        ev.dead = true
        break
      case '*':
        note.harmonic = true
        break
      default:
        throw new Error(`Unknown flag "${c}" in "${src}"`)
    }
  }
  return note
}

export function isLegato(ev: TabEvent): boolean {
  return !!(ev.hammer || ev.pull || ev.tap || ev.notes.some((n) => n.release) || (ev.slide && !ev.explicitPick))
}

export function parseTab(src: string, picking: PickingMode = 'alt'): TabEvent[] {
  const events: TabEvent[] = []
  let dur = 0.25
  let pos = 0
  let bar = false
  for (const tok of src.trim().split(/\s+/)) {
    if (!tok) continue
    if (tok.startsWith('@')) {
      const dotted = tok.endsWith('.')
      const n = Number(dotted ? tok.slice(1, -1) : tok.slice(1))
      if (!n) throw new Error(`Bad duration "${tok}"`)
      dur = (4 / n) * (dotted ? 1.5 : 1)
      continue
    }
    if (tok === '|') {
      bar = true
      continue
    }
    const ev: TabEvent = { notes: [], start: pos, dur, barBefore: bar || undefined }
    bar = false
    if (tok === '-') ev.rest = true
    else ev.notes = tok.split('+').map((part) => parseNote(part, ev))
    events.push(ev)
    pos += dur
  }
  assignPicking(events, picking)
  return events
}

function assignPicking(events: TabEvent[], mode: PickingMode) {
  let last: Pick | undefined
  let lastString: number | undefined
  for (const ev of events) {
    if (ev.rest) continue
    const lowest = Math.max(...ev.notes.map((n) => n.s))
    if (ev.explicitPick) {
      last = ev.pick
      lastString = lowest
      continue
    }
    if (mode === 'none' || isLegato(ev)) {
      lastString = lowest
      continue
    }
    let p: Pick
    if (mode === 'down') p = 'D'
    else if (mode === 'grid') {
      const sixteenth = ev.start * 4
      const onGrid = Math.abs(sixteenth - Math.round(sixteenth)) < 1e-6
      p = onGrid ? (Math.round(sixteenth) % 2 === 0 ? 'D' : 'U') : last === 'D' ? 'U' : 'D'
    } else if (mode === 'economy' && lastString !== undefined && lowest !== lastString) {
      p = lowest < lastString ? 'D' : 'U'
    } else p = last === 'D' ? 'U' : 'D'
    ev.pick = p
    last = p
    lastString = lowest
  }
}

export function totalBeats(events: TabEvent[]): number {
  const last = events[events.length - 1]
  return last ? last.start + last.dur : 0
}

export function fretRange(events: TabEvent[]): [number, number] {
  let lo = Infinity
  let hi = 0
  let open = false
  for (const ev of events)
    for (const n of ev.notes) {
      if (n.f === 0) open = true
      else {
        lo = Math.min(lo, n.f)
        hi = Math.max(hi, n.f)
      }
    }
  if (lo === Infinity) return [0, 5]
  const start = open ? 0 : Math.max(0, lo - 1)
  const end = Math.max(start + 5, hi + 1)
  return [start, end]
}
