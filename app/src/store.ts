import { useCallback, useEffect, useState } from 'react'
import { SEED_STATE } from './seed'
import type { AppState, Goals, Item, LogEntry } from './types'

const STORAGE_KEY = 'plan-tracker-v1'

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...SEED_STATE, ...JSON.parse(raw) }
  } catch {
    /* fall through to seed */
  }
  return SEED_STATE
}

export function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addLogs = useCallback((entries: Omit<LogEntry, 'id'>[]) => {
    const created = entries.map((e) => ({ ...e, id: newId() }))
    setState((s) => ({ ...s, logs: [...s.logs, ...created] }))
    return created
  }, [])

  const updateLog = useCallback((id: string, qty: number) => {
    setState((s) => ({ ...s, logs: s.logs.map((l) => (l.id === id ? { ...l, qty } : l)) }))
  }, [])

  const removeLog = useCallback((id: string) => {
    setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) }))
  }, [])

  const upsertItem = useCallback((item: Item) => {
    setState((s) => {
      const exists = s.items.some((i) => i.id === item.id)
      return {
        ...s,
        items: exists ? s.items.map((i) => (i.id === item.id ? item : i)) : [...s.items, item],
      }
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }))
  }, [])

  const setGoals = useCallback((goals: Goals) => {
    setState((s) => ({ ...s, goals }))
  }, [])

  const markAutoLogged = useCallback((day: string) => {
    setState((s) =>
      s.autoLoggedDays.includes(day)
        ? s
        : { ...s, autoLoggedDays: [...s.autoLoggedDays.slice(-60), day] },
    )
  }, [])

  const replaceState = useCallback((next: AppState) => setState({ ...SEED_STATE, ...next }), [])

  return {
    state,
    addLogs,
    updateLog,
    removeLog,
    upsertItem,
    removeItem,
    setGoals,
    markAutoLogged,
    replaceState,
  }
}

export type Store = ReturnType<typeof useAppState>
