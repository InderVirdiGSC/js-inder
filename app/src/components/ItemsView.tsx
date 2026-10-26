import { useState } from 'react'
import { fmtQty, macrosFor, round1 } from '../nutrition'
import type { FixedMode, Item, Unit } from '../types'

interface Props {
  items: Item[]
  onSave: (item: Item) => void
  onDelete: (id: string) => void
  logLink: (itemId: string) => string
}

const UNITS: Unit[] = ['g', 'ml', 'piece', 'scoop', 'serving']
const FIXED: { value: FixedMode; label: string }[] = [
  { value: 'off', label: 'Not fixed' },
  { value: 'confirm', label: 'Fixed: confirm with one button' },
  { value: 'auto', label: 'Fixed: log automatically each day' },
]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const BLANK: Item = {
  id: '',
  name: '',
  unit: 'g',
  basisQty: 100,
  proteinPerBasis: 0,
  kcalPerBasis: 0,
  defaultQty: 100,
  step: 5,
  fixedMode: 'off',
}

function NumField({
  label,
  value,
  onChange,
  optional,
}: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  optional?: boolean
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        placeholder={optional ? 'none' : undefined}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </label>
  )
}

export function ItemEditor({
  initial,
  existingIds,
  onSave,
  onDelete,
  onClose,
  logLink,
}: {
  initial: Item
  existingIds: string[]
  onSave: (item: Item) => void
  onDelete?: () => void
  onClose: () => void
  logLink: (itemId: string) => string
}) {
  const [draft, setDraft] = useState<Item>(initial)
  const [copied, setCopied] = useState(false)
  const set = <K extends keyof Item>(k: K, v: Item[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const isNew = !initial.id

  const valid =
    draft.name.trim() !== '' &&
    draft.basisQty > 0 &&
    draft.defaultQty > 0 &&
    draft.step > 0 &&
    draft.proteinPerBasis >= 0 &&
    draft.kcalPerBasis >= 0

  const save = () => {
    let id = draft.id
    if (isNew) {
      const base = slugify(draft.name) || 'item'
      id = base
      for (let n = 2; existingIds.includes(id); n++) id = `${base}-${n}`
    }
    const labelChanged =
      draft.basisQty !== initial.basisQty ||
      draft.proteinPerBasis !== initial.proteinPerBasis ||
      draft.kcalPerBasis !== initial.kcalPerBasis
    const confirmed = draft.estimated && labelChanged
    onSave({
      ...draft,
      id,
      name: draft.name.trim(),
      brand: draft.brand?.trim() || undefined,
      estimated: confirmed ? undefined : draft.estimated,
      note: confirmed && draft.note === initial.note ? undefined : draft.note,
    })
  }

  const m = macrosFor(draft, draft.defaultQty || 0)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(logLink(draft.id))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copy this link', logLink(draft.id))
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet sheet-tall" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-handle" />
        <h2>{isNew ? 'New item' : `Edit ${initial.name}`}</h2>

        <label className="field">
          <span>Name</span>
          <input value={draft.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="field">
          <span>Brand</span>
          <input value={draft.brand ?? ''} onChange={(e) => set('brand', e.target.value)} />
        </label>
        <label className="field">
          <span>Unit</span>
          <select value={draft.unit} onChange={(e) => set('unit', e.target.value as Unit)}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="label-box">
          <legend>From the nutrition label</legend>
          <NumField
            label={`Serving size (${draft.unit})`}
            value={draft.basisQty}
            onChange={(v) => set('basisQty', v ?? 0)}
          />
          <NumField label="Protein (g)" value={draft.proteinPerBasis} onChange={(v) => set('proteinPerBasis', v ?? 0)} />
          <NumField label="Calories" value={draft.kcalPerBasis} onChange={(v) => set('kcalPerBasis', v ?? 0)} />
        </fieldset>

        <NumField label={`Default amount (${draft.unit})`} value={draft.defaultQty} onChange={(v) => set('defaultQty', v ?? 0)} />
        <NumField label={`+/− step (${draft.unit})`} value={draft.step} onChange={(v) => set('step', v ?? 0)} />
        <NumField
          label={`Daily max (${draft.unit})`}
          value={draft.maxQtyPerDay}
          optional
          onChange={(v) => set('maxQtyPerDay', v && v > 0 ? v : undefined)}
        />
        <label className="field">
          <span>Fixed daily item</span>
          <select value={draft.fixedMode} onChange={(e) => set('fixedMode', e.target.value as FixedMode)}>
            {FIXED.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Note</span>
          <input value={draft.note ?? ''} onChange={(e) => set('note', e.target.value || undefined)} />
        </label>

        <p className="preview">
          Default {fmtQty(draft.defaultQty || 0, draft.unit)} = <strong>{round1(m.protein)} g</strong> protein ·{' '}
          <strong>{Math.round(m.kcal)}</strong> cal
        </p>

        {!isNew && (
          <div className="nfc-box">
            <span className="muted">NFC / Shortcuts link</span>
            <code>{logLink(draft.id)}</code>
            <button className="btn btn-ghost" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        )}

        <div className="sheet-actions">
          {onDelete && (
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm(`Delete ${initial.name}? Past logs for it will be hidden.`)) onDelete()
              }}
            >
              Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export function ItemsView({ items, onSave, onDelete, logLink }: Props) {
  const [editing, setEditing] = useState<Item | null>(null)

  return (
    <div className="view">
      <ul className="item-list">
        {items.map((item) => {
          const m = macrosFor(item, item.defaultQty)
          return (
            <li key={item.id}>
              <button onClick={() => setEditing(item)}>
                <div>
                  <div className="item-name">
                    {item.name}
                    {item.fixedMode !== 'off' && <span className="badge">fixed</span>}
                    {item.estimated && <span className="badge badge-warn">estimate</span>}
                  </div>
                  <div className="muted small">
                    {item.brand ? `${item.brand} · ` : ''}label: {item.proteinPerBasis} g P, {item.kcalPerBasis} cal per{' '}
                    {fmtQty(item.basisQty, item.unit)}
                  </div>
                  {item.note && <div className={`small ${item.estimated ? 'warn' : 'muted'}`}>{item.note}</div>}
                </div>
                <div className="item-default">
                  {fmtQty(item.defaultQty, item.unit)}
                  <small>
                    {round1(m.protein)}g · {Math.round(m.kcal)}
                  </small>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      <button className="btn btn-primary btn-block" onClick={() => setEditing(BLANK)}>
        Add item
      </button>

      {editing && (
        <ItemEditor
          key={editing.id || 'new'}
          initial={editing}
          existingIds={items.map((i) => i.id)}
          logLink={logLink}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            onSave(item)
            setEditing(null)
          }}
          onDelete={
            editing.id
              ? () => {
                  onDelete(editing.id)
                  setEditing(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
