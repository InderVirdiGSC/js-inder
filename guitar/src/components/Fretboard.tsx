import { STRING_NAME } from './fingers'

export interface Dot {
  key: string
  s: number
  f: number
  label?: string
  color: string
  state: 'active' | 'ghost' | 'root' | 'normal'
  bend?: number
  onClick?: () => void
}

const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21]
const GAP = 22
const TOP = 16
const W = 640

function bendLabel(b: number): string {
  return b === 1 ? '½' : b === 2 ? 'full' : b === 3 ? '1½' : `${b / 2}`
}

export function Fretboard({ start, end, dots }: { start: number; end: number; dots: Dot[] }) {
  const showNut = start === 0
  const left = showNut ? 34 : 14
  const count = end - start
  const fretW = (W - left - 10) / count
  const height = TOP * 2 + GAP * 5 + 18
  const y = (s: number) => TOP + (s - 1) * GAP
  const x = (f: number) => (f === 0 ? left - 16 : left + (f - start - 0.5) * fretW)
  const midY = (y(3) + y(4)) / 2

  return (
    <svg className="fretboard" viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Fretboard diagram">
      <rect x={left} y={TOP - 8} width={W - left - 10} height={GAP * 5 + 16} rx="4" className="fb-wood" />
      {Array.from({ length: count }, (_, i) => start + i + 1).map((f) =>
        INLAYS.includes(f) ? (
          <circle key={`in${f}`} cx={x(f)} cy={midY} r="5" className="fb-inlay" />
        ) : f === 12 || f === 24 ? (
          <g key={`in${f}`}>
            <circle cx={x(f)} cy={(y(2) + y(3)) / 2} r="5" className="fb-inlay" />
            <circle cx={x(f)} cy={(y(4) + y(5)) / 2} r="5" className="fb-inlay" />
          </g>
        ) : null,
      )}
      {Array.from({ length: count + 1 }, (_, i) => (
        <line
          key={`fr${i}`}
          x1={left + i * fretW}
          x2={left + i * fretW}
          y1={TOP - 8}
          y2={TOP + GAP * 5 + 8}
          className={i === 0 && showNut ? 'fb-nut' : 'fb-fret'}
        />
      ))}
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <g key={`s${s}`}>
          <line x1={left} x2={W - 10} y1={y(s)} y2={y(s)} className="fb-string" strokeWidth={0.8 + s * 0.35} />
          {showNut && (
            <text x={6} y={y(s) + 4} className="fb-label">
              {STRING_NAME[s].replace('high ', '').replace('low ', '')}
            </text>
          )}
        </g>
      ))}
      {Array.from({ length: count }, (_, i) => start + i + 1).map((f) => (
        <text key={`n${f}`} x={x(f)} y={height - 4} textAnchor="middle" className="fb-fretnum">
          {f}
        </text>
      ))}
      {dots.map((d) => {
        const cx = x(d.f)
        const cy = y(d.s)
        const active = d.state === 'active'
        const r = active ? 10.5 : d.state === 'ghost' ? 8 : 9
        return (
          <g key={d.key} className={`fb-dot fb-${d.state}`} onClick={d.onClick} style={d.onClick ? { cursor: 'pointer' } : undefined}>
            {active && <circle cx={cx} cy={cy} r={r + 6} fill={d.color} className="fb-glow" />}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={d.state === 'ghost' ? 'var(--bg)' : d.color}
              stroke={d.state === 'root' ? '#fff' : d.color}
              strokeWidth={d.state === 'ghost' ? 1.6 : d.state === 'root' ? 2 : 0}
              opacity={d.state === 'ghost' ? 0.75 : 1}
            />
            {d.label && (
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                className="fb-dot-label"
                fill={d.state === 'ghost' ? d.color : '#0b0e13'}
                fontSize={active ? 12 : 10}
              >
                {d.label}
              </text>
            )}
            {active && d.bend ? (
              <g className="fb-bend">
                <path d={`M${cx + 12} ${cy} q 10 0 10 ${GAP * 0.9}`} fill="none" stroke={d.color} strokeWidth="2" />
                <path d={`M${cx + 18} ${cy + GAP * 0.7} l4 6 l4 -6`} fill="none" stroke={d.color} strokeWidth="2" />
                <text x={cx + 26} y={cy + GAP * 0.9 + 12} className="fb-bend-label" fill={d.color}>
                  {bendLabel(d.bend)}
                </text>
              </g>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
