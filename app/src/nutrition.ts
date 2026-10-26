import type { Goals, Item, LogEntry, Unit } from './types'

export function macrosFor(item: Item, qty: number) {
  const factor = qty / item.basisQty
  return {
    protein: factor * item.proteinPerBasis,
    kcal: factor * item.kcalPerBasis,
  }
}

export function dayKey(ts: number | Date = Date.now()): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export interface DaySummary {
  protein: number
  kcal: number
  qtyByItem: Record<string, number>
  overMax: string[]
  proteinHit: boolean
  kcalOk: boolean
  allHit: boolean
}

export function summarize(items: Item[], logs: LogEntry[], goals: Goals): DaySummary {
  const byId = new Map(items.map((i) => [i.id, i]))
  let protein = 0
  let kcal = 0
  const qtyByItem: Record<string, number> = {}
  for (const log of logs) {
    const item = byId.get(log.itemId)
    if (!item) continue
    const m = macrosFor(item, log.qty)
    protein += m.protein
    kcal += m.kcal
    qtyByItem[item.id] = (qtyByItem[item.id] ?? 0) + log.qty
  }
  const overMax = items
    .filter((i) => i.maxQtyPerDay && (qtyByItem[i.id] ?? 0) > i.maxQtyPerDay)
    .map((i) => i.id)
  const proteinHit = protein >= goals.proteinTarget
  const kcalOk = kcal <= goals.kcalLimit
  return {
    protein,
    kcal,
    qtyByItem,
    overMax,
    proteinHit,
    kcalOk,
    allHit: proteinHit && kcalOk && overMax.length === 0,
  }
}

const UNIT_LABEL: Record<Unit, [string, string]> = {
  g: ['g', 'g'],
  ml: ['ml', 'ml'],
  piece: ['pc', 'pcs'],
  scoop: ['scoop', 'scoops'],
  serving: ['serving', 'servings'],
}

export function unitLabel(qty: number, unit: Unit): string {
  const [one, many] = UNIT_LABEL[unit]
  return qty === 1 ? one : many
}

export function fmtQty(qty: number, unit: Unit): string {
  const n = Math.round(qty * 100) / 100
  return `${n} ${unitLabel(n, unit)}`
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}
