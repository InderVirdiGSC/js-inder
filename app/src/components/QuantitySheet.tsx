import { useState } from 'react'
import { fmtQty, macrosFor, round1, unitLabel } from '../nutrition'
import type { Item } from '../types'

interface Props {
  item: Item
  initialQty: number
  mode: 'new' | 'edit'
  onSubmit: (qty: number, saveAsDefault: boolean) => void
  onDelete?: () => void
  onClose: () => void
}

const MULTIPLIERS = [0.5, 1, 1.5, 2]

export function QuantitySheet({ item, initialQty, mode, onSubmit, onDelete, onClose }: Props) {
  const [text, setText] = useState(String(initialQty))
  const [saveDefault, setSaveDefault] = useState(false)
  const qty = Number(text)
  const valid = Number.isFinite(qty) && qty > 0
  const m = macrosFor(item, valid ? qty : 0)

  const nudge = (dir: 1 | -1) => {
    const next = Math.max(item.step, round1((valid ? qty : 0) + dir * item.step))
    setText(String(next))
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={item.name}>
        <div className="sheet-handle" />
        <h2>{item.name}</h2>
        {item.brand && <p className="muted">{item.brand}</p>}

        <div className="qty-row">
          <button className="qty-btn" onClick={() => nudge(-1)} aria-label="Decrease">
            −
          </button>
          <label className="qty-input">
            <input
              type="number"
              inputMode="decimal"
              value={text}
              min={0}
              step={item.step}
              onChange={(e) => setText(e.target.value)}
            />
            <span>{unitLabel(qty, item.unit)}</span>
          </label>
          <button className="qty-btn" onClick={() => nudge(1)} aria-label="Increase">
            +
          </button>
        </div>

        <div className="chips">
          {MULTIPLIERS.map((x) => {
            const v = round1(item.defaultQty * x)
            return (
              <button
                key={x}
                className={`chip ${valid && qty === v ? 'chip-on' : ''}`}
                onClick={() => setText(String(v))}
              >
                {x === 1 ? 'Default' : `${x}×`}
                <small>{fmtQty(v, item.unit)}</small>
              </button>
            )
          })}
        </div>

        <div className="preview">
          <strong>{round1(m.protein)} g</strong> protein · <strong>{Math.round(m.kcal)}</strong> cal
        </div>

        {mode === 'new' && (
          <label className="toggle">
            <input type="checkbox" checked={saveDefault} onChange={(e) => setSaveDefault(e.target.checked)} />
            Save {valid ? fmtQty(qty, item.unit) : 'this'} as the new default
          </label>
        )}

        <div className="sheet-actions">
          {onDelete && (
            <button className="btn btn-danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => onSubmit(qty, saveDefault)}>
            {mode === 'new' ? 'Log' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
