import { useCallback, useEffect, useState } from 'react'
import { getAudio, playClick } from './music/audio'
import type { Block } from './practice'
import { dayKey, type Store } from './store'

export interface SessionState {
  day: string
  blocks: Block[]
  idx: number
  elapsed: number[]
  running: boolean
  finished: boolean
}

export function usePracticeSession(store: Store) {
  const [session, setSession] = useState<SessionState | null>(null)

  useEffect(() => {
    if (!session?.running) return
    const id = window.setInterval(() => {
      setSession((s) => {
        if (!s || !s.running) return s
        const elapsed = [...s.elapsed]
        elapsed[s.idx] += 1
        return { ...s, elapsed }
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [session?.running])

  const current = session ? session.elapsed[session.idx] : 0
  const limit = session ? session.blocks[session.idx].minutes * 60 : 0
  useEffect(() => {
    if (limit > 0 && current === limit) {
      const t = getAudio().currentTime
      playClick(t + 0.05, true)
      playClick(t + 0.3, true)
      playClick(t + 0.55, true)
    }
  }, [current, limit])

  const begin = useCallback((blocks: Block[]) => {
    getAudio()
    setSession({ day: dayKey(), blocks, idx: 0, elapsed: blocks.map(() => 0), running: true, finished: false })
  }, [])

  const { addSession } = store
  const finish = useCallback(() => {
    if (!session || session.finished) return
    const secs = session.elapsed.reduce((a, b) => a + b, 0)
    const blocksDone = session.elapsed.filter((e) => e > 0).length
    if (secs >= 30) addSession(Math.max(1, Math.round(secs / 60)), blocksDone)
    setSession((s) => (s ? { ...s, running: false, finished: true } : s))
  }, [session, addSession])

  const next = useCallback(() => {
    setSession((s) => (s && s.idx < s.blocks.length - 1 ? { ...s, idx: s.idx + 1, running: true } : s))
  }, [])

  const goTo = useCallback((idx: number) => setSession((s) => (s ? { ...s, idx } : s)), [])
  const toggle = useCallback(() => setSession((s) => (s ? { ...s, running: !s.running } : s)), [])
  const close = useCallback(() => setSession(null), [])

  return { session, begin, finish, next, goTo, toggle, close }
}

export type PracticeSession = ReturnType<typeof usePracticeSession>
