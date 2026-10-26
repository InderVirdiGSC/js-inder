import { useEffect, useMemo, useRef } from 'react'
import type { TabEvent } from '../music/notation'
import { fingerColor } from './fingers'

const TOP = 36
const GAP = 15
const PAD = 22

function techLabel(ev: TabEvent): string | null {
  if (ev.tap) return 'T'
  if (ev.hammer) return 'h'
  if (ev.pull) return 'p'
  if (ev.slide) return 'sl'
  return null
}

function bendText(b: number, release?: boolean) {
  const amt = b === 1 ? '½' : b === 2 ? 'full' : b === 3 ? '1½' : String(b / 2)
  return release ? `rel` : amt
}

export function TabView({ events, active, onSeek }: { events: TabEvent[]; active: number; onSeek?: (i: number) => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  const layout = useMemo(() => {
    const cols: { x: number; bar: number | null }[] = []
    const end = events.reduce((x, ev) => {
      const left = ev.barBefore ? x + 8 : x
      cols.push({ x: left + 10, bar: ev.barBefore ? left - 4 : null })
      return left + Math.max(26, Math.min(80, ev.dur * 70))
    }, PAD)
    return { cols, width: end + PAD }
  }, [events])

  useEffect(() => {
    const el = scroller.current
    if (!el || active < 0) return
    const col = layout.cols[active]
    const target = col.x - el.clientWidth / 3
    if (col.x < el.scrollLeft + 20 || col.x > el.scrollLeft + el.clientWidth - 40) el.scrollTo({ left: target, behavior: 'smooth' })
  }, [active, layout])

  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 })
  }, [events])

  const y = (s: number) => TOP + (s - 1) * GAP
  const height = TOP + GAP * 5 + 30

  return (
    <div className="tab-scroll" ref={scroller}>
      <svg width={layout.width} height={height} className="tab" role="img" aria-label="Tablature">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <line key={s} x1={6} x2={layout.width - 6} y1={y(s)} y2={y(s)} className="tab-line" />
        ))}
        <text x={8} y={y(1) - 18} className="tab-hint">
          pick
        </text>
        {layout.cols.map((c, i) => c.bar !== null && <line key={`b${i}`} x1={c.bar} x2={c.bar} y1={y(1)} y2={y(6)} className="tab-bar" />)}
        {events.map((ev, i) => {
          const { x } = layout.cols[i]
          const isActive = i === active
          const tech = techLabel(ev)
          const prevPm = events[i - 1]?.pm
          return (
            <g key={i} onClick={onSeek ? () => onSeek(i) : undefined}>
              {isActive && <rect x={x - 12} y={6} width={24} height={height - 10} rx="6" className="tab-cursor" />}
              {ev.pick === 'D' && <path d={`M${x - 5} ${y(1) - 12} V${y(1) - 20} H${x + 5} V${y(1) - 12}`} className="tab-pick" />}
              {ev.pick === 'U' && <path d={`M${x - 5} ${y(1) - 21} L${x} ${y(1) - 11} L${x + 5} ${y(1) - 21}`} className="tab-pick" />}
              {ev.pick === 'F' && (
                <text x={x} y={y(1) - 12} textAnchor="middle" className="tab-pickf">
                  m
                </text>
              )}
              {ev.rest && (
                <text x={x} y={y(3) + 10} textAnchor="middle" className="tab-rest">
                  𝄽
                </text>
              )}
              {ev.notes.map((n, k) => {
                const label = ev.dead ? 'x' : n.harmonic ? `<${n.f}>` : String(n.f)
                const w = label.length * 7 + 4
                return (
                  <g key={k}>
                    <rect x={x - w / 2} y={y(n.s) - 7} width={w} height={14} className="tab-notebg" />
                    <text x={x} y={y(n.s) + 4} textAnchor="middle" className="tab-fret" fill={fingerColor(n.g)}>
                      {label}
                    </text>
                    {n.bend ? (
                      <text x={x + w / 2 + 1} y={y(n.s) - 6} className="tab-tech">
                        {n.release ? '↘' : '↗'}
                        {bendText(n.bend, n.release)}
                      </text>
                    ) : null}
                  </g>
                )
              })}
              {tech && ev.notes[0] && (
                <text x={x - 13} y={y(ev.notes[0].s) - 8} textAnchor="middle" className="tab-tech">
                  {tech}
                </text>
              )}
              {ev.vibrato && ev.notes[0] && (
                <text x={x + 12} y={y(Math.min(...ev.notes.map((n) => n.s))) - 8} className="tab-vib">
                  ~~
                </text>
              )}
              {ev.pm && (
                <text x={x} y={y(6) + 20} textAnchor="middle" className="tab-pm">
                  {prevPm ? '–' : 'PM'}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
