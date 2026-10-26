import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getAudio, playClick, playNote } from '../music/audio'
import { isLegato, midiOf, totalBeats, type TabEvent } from '../music/notation'

export interface PlayerOpts {
  bpm: number
  loop: boolean
  click: boolean
  countIn: boolean
  drive: boolean
}

interface Run {
  t0: number
  spb: number
  total: number
  loopIdx: number
  evIdx: number
  nextClick: number
  timer: number
  raf: number
}

const LOOKAHEAD = 0.15

function scheduleEvent(events: TabEvent[], i: number, time: number, spb: number, drive: boolean, isLast: boolean) {
  const ev = events[i]
  if (ev.rest) return
  const prev = events[i - 1]
  const legato = isLegato(ev)
  const dur = isLast ? Math.max(ev.dur * spb, 1.2) : ev.dur * spb
  for (const n of ev.notes) {
    const held =
      legato && prev?.notes.some((p) => p.s === n.s && p.f === n.f && !n.bend && !n.release && !p.bend)
    if (held) continue
    let bendFrom: number | undefined
    let bendTo: number | undefined
    if (n.release) {
      bendFrom = (n.bend ?? 2) * 100
      bendTo = 0
    } else if (n.bend) {
      bendFrom = 0
      bendTo = n.bend * 100
    } else if (ev.slide) {
      const from = prev?.notes.find((p) => p.s === n.s)
      if (from) {
        bendFrom = (from.f - n.f) * 100
        bendTo = 0
      }
    }
    playNote({
      time,
      midi: midiOf(n),
      dur,
      drive,
      gain: ev.hammer || ev.pull ? 0.75 : ev.tap ? 0.9 : ev.notes.length > 1 ? 0.75 : 1,
      soft: ev.hammer || ev.pull,
      pm: ev.pm,
      dead: ev.dead,
      harmonic: n.harmonic,
      bendFrom,
      bendTo,
      vibrato: ev.vibrato,
    })
  }
}

export function useTabPlayer(events: TabEvent[], opts: PlayerOpts) {
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(-1)
  const [countdown, setCountdown] = useState(0)
  const run = useRef<Run | null>(null)
  const optsRef = useRef(opts)
  useLayoutEffect(() => {
    optsRef.current = opts
  })

  const stop = useCallback(() => {
    const r = run.current
    if (r) {
      window.clearInterval(r.timer)
      cancelAnimationFrame(r.raf)
    }
    run.current = null
    setPlaying(false)
    setActive(-1)
    setCountdown(0)
  }, [])

  const start = useCallback(() => {
    if (!events.length) return
    stop()
    const ac = getAudio()
    const o = optsRef.current
    const spb = 60 / o.bpm
    const countBeats = o.countIn ? 4 : 0
    const t0 = ac.currentTime + 0.12 + countBeats * spb
    for (let b = 0; b < countBeats; b++) playClick(t0 - (countBeats - b) * spb, b === 0)
    const r: Run = { t0, spb, total: totalBeats(events), loopIdx: 0, evIdx: 0, nextClick: 0, timer: 0, raf: 0 }
    run.current = r

    const tick = () => {
      const cur = optsRef.current
      const horizon = ac.currentTime + LOOKAHEAD
      while (true) {
        if (r.evIdx >= events.length) {
          if (!cur.loop) break
          r.loopIdx++
          r.evIdx = 0
        }
        const ev = events[r.evIdx]
        const time = r.t0 + (r.loopIdx * r.total + ev.start) * r.spb
        if (time > horizon) break
        const isLast = !cur.loop && r.evIdx === events.length - 1
        scheduleEvent(events, r.evIdx, time, r.spb, cur.drive, isLast)
        r.evIdx++
      }
      while (true) {
        const time = r.t0 + r.nextClick * r.spb
        if (time > horizon) break
        if (!cur.loop && r.nextClick >= Math.ceil(r.total - 1e-6)) break
        if (cur.click) {
          const barPos = cur.loop ? (r.nextClick % Math.ceil(r.total)) : r.nextClick
          playClick(time, barPos % 4 === 0)
        }
        r.nextClick++
      }
    }

    const frame = () => {
      const now = ac.currentTime
      const beat = (now - r.t0) / r.spb
      if (beat < 0) {
        setCountdown(Math.ceil(-beat))
        setActive(-1)
      } else {
        setCountdown(0)
        if (!optsRef.current.loop && beat >= r.total + 0.6) {
          stop()
          return
        }
        const local = beat % r.total
        let idx = -1
        for (let i = 0; i < events.length; i++) {
          if (events[i].start <= local + 1e-6) idx = i
          else break
        }
        if (idx >= 0 && events[idx].rest) idx = -1
        setActive(idx)
      }
      r.raf = requestAnimationFrame(frame)
    }

    tick()
    r.timer = window.setInterval(tick, 25)
    r.raf = requestAnimationFrame(frame)
    setPlaying(true)
  }, [events, stop])

  useEffect(() => stop, [events, stop])

  const startRef = useRef(start)
  useLayoutEffect(() => {
    startRef.current = start
  })
  useEffect(() => {
    if (run.current) startRef.current()
  }, [opts.bpm])

  return { playing, active, countdown, start, stop }
}
