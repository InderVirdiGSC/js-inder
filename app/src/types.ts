export type Unit = 'g' | 'ml' | 'piece' | 'scoop' | 'serving'

export type FixedMode = 'off' | 'confirm' | 'auto'

export interface Item {
  id: string
  name: string
  brand?: string
  unit: Unit
  /** Quantity the label values refer to, e.g. 55 for "per 4 cm cube (55 g)". */
  basisQty: number
  proteinPerBasis: number
  kcalPerBasis: number
  defaultQty: number
  step: number
  maxQtyPerDay?: number
  fixedMode: FixedMode
  note?: string
}

export interface LogEntry {
  id: string
  itemId: string
  qty: number
  timestamp: number
}

export interface Goals {
  proteinTarget: number
  kcalLimit: number
}

export interface AppState {
  items: Item[]
  logs: LogEntry[]
  goals: Goals
  autoLoggedDays: string[]
}
