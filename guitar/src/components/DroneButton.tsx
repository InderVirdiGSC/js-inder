import { useEffect, useRef, useState } from 'react'
import { startDrone } from '../music/audio'
import { NOTE_NAMES } from '../music/theory'

export function DroneButton({ root, drive, label }: { root: number; drive: boolean; label?: string }) {
  const [on, setOn] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!on) return
    stopRef.current = startDrone(root, drive)
    return () => {
      stopRef.current?.()
      stopRef.current = null
    }
  }, [on, root, drive])

  return (
    <button className={`chip ${on ? 'chip-on' : ''}`} onClick={() => setOn((v) => !v)}>
      {on ? '■ Stop drone' : `▶ ${label ?? `${NOTE_NAMES[root % 12]} drone`}`}
    </button>
  )
}
