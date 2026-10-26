import { useRef, useState } from 'react'
import type { AppState, Goals } from '../types'

interface Props {
  state: AppState
  onSaveGoals: (g: Goals) => void
  onImport: (s: AppState) => void
  onReset: () => void
  logLink: (itemId: string) => string
}

export function GoalsView({ state, onSaveGoals, onImport, onReset, logLink }: Props) {
  const [protein, setProtein] = useState(String(state.goals.proteinTarget))
  const [kcal, setKcal] = useState(String(state.goals.kcalLimit))
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const p = Number(protein)
  const k = Number(kcal)
  const valid = p > 0 && k > 0
  const dirty = p !== state.goals.proteinTarget || k !== state.goals.kcalLimit

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plan-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as AppState
      if (!Array.isArray(parsed.items) || !Array.isArray(parsed.logs) || !parsed.goals) throw new Error()
      if (window.confirm('Replace all current data with this backup?')) onImport(parsed)
    } catch {
      window.alert('That file is not a Plan Tracker backup.')
    }
  }

  return (
    <div className="view">
      <h3 className="section-title">Daily goals</h3>
      <label className="field">
        <span>Protein target (g)</span>
        <input type="number" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} />
      </label>
      <label className="field">
        <span>Calorie limit</span>
        <input type="number" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} />
      </label>
      <button
        className="btn btn-primary btn-block"
        disabled={!valid || !dirty}
        onClick={() => {
          onSaveGoals({ proteinTarget: p, kcalLimit: k })
          setSaved(true)
          setTimeout(() => setSaved(false), 1500)
        }}
      >
        {saved ? 'Saved' : 'Save goals'}
      </button>

      <h3 className="section-title">NFC tags (optional)</h3>
      <div className="card">
        <p>Each item has its own link. Opening it logs that item's default amount.</p>
        <ol>
          <li>Stick an NFC tag on the container (milk shelf, whey tub, paneer box…).</li>
          <li>
            iPhone: <b>Shortcuts → Automation → New → NFC</b>, scan the tag, then add the action <b>Open URLs</b> with
            the item's link. Turn off <b>Ask Before Running</b>.
          </li>
          <li>Tap the phone on the tag to log it.</li>
        </ol>
        <p className="muted small">
          Example: <code>{logLink(state.items[0]?.id ?? 'milk')}</code>. Copy each item's link from the Items tab.
        </p>
      </div>

      <h3 className="section-title">Data</h3>
      <p className="muted small">Everything is stored on this device only. Export a backup now and then.</p>
      <div className="row">
        <button className="btn btn-ghost" onClick={exportData}>
          Export backup
        </button>
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importData(f)
            e.target.value = ''
          }}
        />
      </div>
      <button
        className="btn btn-danger btn-block"
        onClick={() => {
          if (window.confirm('Erase all logs and restore the original items and goals?')) onReset()
        }}
      >
        Reset everything
      </button>
    </div>
  )
}
