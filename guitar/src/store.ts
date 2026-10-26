import { useCallback, useEffect, useState } from 'react'
import type { LevelId } from './data/curriculum'

const STORAGE_KEY = 'guitar-coach-v1'

export interface BpmEntry {
  day: string
  bpm: number
}

export interface Session {
  day: string
  minutes: number
  blocks: number
}

export interface Settings {
  sessionMinutes: number
  drive: boolean
  click: boolean
  countIn: boolean
}

export interface AppState {
  level: LevelId
  completed: string[]
  bpm: Record<string, BpmEntry[]>
  sessions: Session[]
  settings: Settings
}

const DEFAULT_STATE: AppState = {
  level: 'intermediate',
  completed: [],
  bpm: {},
  sessions: [],
  settings: { sessionMinutes: 30, drive: true, click: true, countIn: true },
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>
      return { ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings } }
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_STATE
}

export function dayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function bestBpm(state: AppState, exerciseId: string): number | undefined {
  const entries = state.bpm[exerciseId]
  if (!entries?.length) return undefined
  return Math.max(...entries.map((e) => e.bpm))
}

export function streak(state: AppState, today = dayKey()): number {
  const days = new Set(state.sessions.map((s) => s.day))
  const d = new Date(`${today}T12:00:00`)
  if (!days.has(today)) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(dayKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setLevel = useCallback((level: LevelId) => setState((s) => ({ ...s, level })), [])

  const toggleCompleted = useCallback((lessonId: string) => {
    setState((s) => ({
      ...s,
      completed: s.completed.includes(lessonId) ? s.completed.filter((id) => id !== lessonId) : [...s.completed, lessonId],
    }))
  }, [])

  const logBpm = useCallback((exerciseId: string, bpm: number) => {
    const day = dayKey()
    setState((s) => {
      const prev = s.bpm[exerciseId] ?? []
      const others = prev.filter((e) => e.day !== day)
      const todayBest = Math.max(bpm, prev.find((e) => e.day === day)?.bpm ?? 0)
      return { ...s, bpm: { ...s.bpm, [exerciseId]: [...others, { day, bpm: todayBest }].slice(-60) } }
    })
  }, [])

  const addSession = useCallback((minutes: number, blocks: number) => {
    const day = dayKey()
    setState((s) => {
      const existing = s.sessions.find((x) => x.day === day)
      const sessions = existing
        ? s.sessions.map((x) => (x.day === day ? { ...x, minutes: x.minutes + minutes, blocks: x.blocks + blocks } : x))
        : [...s.sessions, { day, minutes, blocks }]
      return { ...s, sessions }
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const reset = useCallback(() => setState(DEFAULT_STATE), [])

  return { state, setLevel, toggleCompleted, logBpm, addSession, updateSettings, reset }
}

export type Store = ReturnType<typeof useAppState>
