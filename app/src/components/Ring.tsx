interface RingProps {
  label: string
  value: number
  target: number
  unit: string
  /** 'reach' = goal is to hit the target; 'limit' = goal is to stay under it. */
  kind: 'reach' | 'limit'
}

export function Ring({ label, value, target, unit, kind }: RingProps) {
  const size = 132
  const stroke = 12
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = target > 0 ? value / target : 0
  const shown = Math.min(pct, 1)

  let tone = 'tone-progress'
  if (kind === 'reach' && pct >= 1) tone = 'tone-good'
  if (kind === 'limit') {
    if (pct > 1) tone = 'tone-bad'
    else if (pct >= 0.9) tone = 'tone-warn'
  }

  const remaining = target - value
  const sub =
    kind === 'reach'
      ? remaining > 0
        ? `${Math.ceil(remaining)} ${unit} to go`
        : 'Goal hit'
      : remaining >= 0
        ? `${Math.floor(remaining)} ${unit} left`
        : `${Math.ceil(-remaining)} ${unit} over`

  return (
    <div className={`ring ${tone}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - shown)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">
        <div className="ring-value">{Math.round(value)}</div>
        <div className="ring-target">
          / {target} {unit}
        </div>
      </div>
      <div className="ring-label">{label}</div>
      <div className="ring-sub">{sub}</div>
    </div>
  )
}
