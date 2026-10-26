import type { ReactNode } from 'react'
import type { DiagramId } from '../data/curriculum'

const SKIN = '#e9b48f'
const SKIN_DARK = '#b97f5c'
const NAIL = '#f6d7c3'
const PICK = '#ffb020'
const GOOD = '#34c759'
const WARN = '#ffb020'
const BAD = '#ff5a5f'
const ACCENT = '#4f8cff'

function Figure({ title, caption, children, viewBox = '0 0 320 180' }: { title: string; caption: string; children: ReactNode; viewBox?: string }) {
  return (
    <figure className="diagram">
      <svg viewBox={viewBox} role="img" aria-label={title}>
        {children}
      </svg>
      <figcaption>
        <b>{title}</b>
        <span>{caption}</span>
      </figcaption>
    </figure>
  )
}

function Label({ x, y, children, anchor = 'start', color = '#c9d1dc' }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className="dg-label" fill={color}>
      {children}
    </text>
  )
}

function Leader({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g className="dg-leader">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <circle cx={x2} cy={y2} r="2.5" />
    </g>
  )
}

/** A limb drawn as an outlined, round-capped tube. */
function Tube({ d, w, fill = SKIN }: { d: string; w: number; fill?: string }) {
  return (
    <g>
      <path d={d} stroke={SKIN_DARK} strokeWidth={w + 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={fill} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

const PICK_PATH = 'M0 -16 C10 -16 14 -10 13 -4 C11 4 4 13 0 16 C-4 13 -11 4 -13 -4 C-14 -10 -10 -16 0 -16 Z'

function Pick({ x, y, rotate = 180, scale = 1 }: { x: number; y: number; rotate?: number; scale?: number }) {
  return <path d={PICK_PATH} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} fill={PICK} stroke="#b77700" strokeWidth="1.2" />
}

function PickGrip() {
  return (
    <Figure title="Pick grip" caption="Pick rests on the side of the index finger’s first joint; the thumb pad presses flat on top. Only 2–3 mm of tip shows.">
      {[150, 160, 170].map((y) => (
        <line key={y} x1="20" x2="300" y1={y} y2={y} className="dg-string" />
      ))}
      <ellipse cx="78" cy="70" rx="62" ry="46" fill={SKIN} stroke={SKIN_DARK} strokeWidth="2" />
      <Tube d="M112 52 C168 46 196 84 176 118 C166 134 146 134 142 120" w={26} />
      <Pick x={166} y={126} rotate={0} />
      <Tube d="M70 100 C102 96 132 98 160 104" w={24} />
      <ellipse cx="160" cy="104" rx="8" ry="9" fill={NAIL} stroke={SKIN_DARK} strokeWidth="1" />
      <Leader x1={226} y1={44} x2={182} y2={82} />
      <Label x={228} y={40}>Index curled,</Label>
      <Label x={228} y={52}>use side of 1st joint</Label>
      <Leader x1={60} y1={140} x2={120} y2={102} />
      <Label x={10} y={152}>Thumb pad flat</Label>
      <Leader x1={226} y1={138} x2={170} y2={140} />
      <Label x={228} y={134}>2–3 mm tip</Label>
      <Label x={228} y={146}>just reaches string</Label>
    </Figure>
  )
}

function PickAngle() {
  return (
    <Figure title="Pick angle" caption="Looking along the string: a flat pick catches the string; tilting the edge 20–30° lets it glide through with less resistance.">
      <g transform="translate(80 92)">
        <circle r="7" fill="#d9d4c7" />
        <g>
          <rect x="-4" y="-62" width="8" height="48" rx="3" fill={PICK} stroke="#b77700" />
          <animateTransform attributeName="transform" type="translate" values="-30 0; 30 0; -30 0" dur="1.6s" repeatCount="indefinite" />
        </g>
        <Label x={0} y={52} anchor="middle" color={WARN}>
          Flat: more “snag”
        </Label>
      </g>
      <g transform="translate(240 92)">
        <circle r="7" fill="#d9d4c7" />
        <g>
          <g transform="rotate(25 0 -14)">
            <rect x="-4" y="-62" width="8" height="48" rx="3" fill={PICK} stroke="#b77700" />
          </g>
          <animateTransform attributeName="transform" type="translate" values="-30 0; 30 0; -30 0" dur="1.6s" repeatCount="indefinite" />
        </g>
        <path d="M-18 -70 A 30 30 0 0 1 4 -76" fill="none" stroke={GOOD} strokeWidth="1.5" />
        <Label x={10} y={-70} color={GOOD}>
          ~25°
        </Label>
        <Label x={0} y={52} anchor="middle" color={GOOD}>
          Edge-picking: glides
        </Label>
      </g>
    </Figure>
  )
}

interface MotionProps {
  title: string
  caption: string
  strings: string[]
  /** y offsets per waypoint, in units of string gaps from the first string (0 = first string). */
  path: number[]
  labels: string[]
}

function Motion({ title, caption, strings, path, labels }: MotionProps) {
  const gap = 28
  const top = 46
  const x0 = 40
  const step = (250 - x0) / (path.length - 1)
  const pts = path.map((p, i) => `${x0 + i * step} ${top + p * gap}`)
  const d = `M${pts.join(' L')}`
  const dur = `${path.length * 0.32}s`
  return (
    <Figure title={title} caption={caption}>
      {strings.map((s, i) => (
        <g key={s}>
          <line x1="28" x2="268" y1={top + i * gap} y2={top + i * gap} className="dg-string" strokeWidth={2.2 - i * 0.3} />
          <Label x={276} y={top + i * gap + 4}>
            {s}
          </Label>
        </g>
      ))}
      <path d={d} className="dg-trace" />
      <g>
        <Pick x={0} y={-10} rotate={180} scale={0.75} />
        <animateMotion dur={dur} repeatCount="indefinite" path={d} />
      </g>
      {labels.map((l, i) => (
        <text key={i} x={x0 + (i + 0.5) * ((250 - x0) / labels.length)} y={22} textAnchor="middle" className="dg-stroke">
          {l}
          <animate
            attributeName="fill"
            values={labels.map((_, k) => (k === i ? ACCENT : '#5d6676')).join(';')}
            dur={dur}
            calcMode="discrete"
            repeatCount="indefinite"
          />
        </text>
      ))}
      <Label x={10} y={172} color="#8b95a5">
        ↓ toward the floor (high strings)
      </Label>
    </Figure>
  )
}

function Alternate() {
  return (
    <Motion
      title="Alternate picking motion"
      caption="Down–up–down–up from the wrist. The pick only travels a few millimetres past the string each way."
      strings={['G']}
      path={[-0.7, 0.7, -0.7, 0.7, -0.7, 0.7, -0.7, 0.7, -0.7]}
      labels={['↓', '↑', '↓', '↑', '↓', '↑', '↓', '↑']}
    />
  )
}

function Economy() {
  return (
    <Motion
      title="Economy picking"
      caption="On a string change, keep moving the same way: the pick “sweeps” to the next string instead of jumping around it."
      strings={['G', 'B', 'E']}
      path={[-0.5, 0.5, -0.5, 1.5, 0.5, 2.5, 1.5, 2.6]}
      labels={['↓', '↑', '↓', '↓', '↑', '↓', '↑']}
    />
  )
}

function Sweep() {
  return (
    <Motion
      title="Sweep picking"
      caption="One controlled push through the strings (like a slow strum) — but every note sounds separately and the previous one is muted."
      strings={['G', 'B', 'E']}
      path={[-0.6, 0.35, 0.35, 1.35, 1.35, 2.5, 2.5, 1.65, 1.65, 0.65, 0.65, -0.6]}
      labels={['↓', '↓', '↓', '↑', '↑', '↑']}
    />
  )
}

function Hybrid() {
  return (
    <Figure title="Hybrid picking" caption="The pick plays the lower string; the middle finger plucks the higher string by curling into the palm.">
      {['D', 'G', 'B', 'E'].map((s, i) => (
        <g key={s}>
          <line x1="28" x2="268" y1={46 + i * 26} y2={46 + i * 26} className="dg-string" strokeWidth={2 - i * 0.3} />
          <Label x={276} y={50 + i * 26}>
            {s}
          </Label>
        </g>
      ))}
      <g>
        <Pick x={110} y={30} rotate={180} scale={0.8} />
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 30; 0 30; 0 0; 0 0" keyTimes="0; 0.2; 0.5; 0.7; 1" dur="1.4s" repeatCount="indefinite" />
      </g>
      <g>
        <rect x="172" y="132" width="16" height="36" rx="8" fill={SKIN} stroke={SKIN_DARK} />
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 0; 0 -38; 0 0" keyTimes="0; 0.5; 0.7; 1" dur="1.4s" repeatCount="indefinite" />
      </g>
      <Label x={70} y={20}>
        Pick ↓ (D string)
      </Label>
      <Label x={196} y={172}>
        Middle finger ↑ (E)
      </Label>
    </Figure>
  )
}

function Frets({ x0, y0, frets, strings, width }: { x0: number; y0: number; frets: number; strings: number; width: number }) {
  const gap = 18
  const fw = width / frets
  return (
    <g>
      <rect x={x0} y={y0 - 8} width={width} height={(strings - 1) * gap + 16} rx="3" className="fb-wood" />
      {Array.from({ length: frets + 1 }, (_, i) => (
        <line key={i} x1={x0 + i * fw} x2={x0 + i * fw} y1={y0 - 8} y2={y0 + (strings - 1) * gap + 8} className="fb-fret" />
      ))}
      {Array.from({ length: strings }, (_, i) => (
        <line key={i} x1={x0} x2={x0 + width} y1={y0 + i * gap} y2={y0 + i * gap} className="fb-string" strokeWidth={0.9 + i * 0.4} />
      ))}
    </g>
  )
}

function FretPlacement() {
  const rows = [
    { x: 140, color: GOOD, mark: '✓', text: 'Just behind the fret: clean, least pressure' },
    { x: 103, color: WARN, mark: '!', text: 'Middle of the fret: needs more force, may buzz' },
    { x: 162, color: BAD, mark: '✗', text: 'On top of the fret wire: muted, thin' },
  ]
  return (
    <Figure title="Fingertip placement" caption="Press with the very tip, as close to the fret wire as possible without sitting on it." viewBox="0 0 320 190">
      {rows.map((r, i) => (
        <g key={i} transform={`translate(0 ${i * 58})`}>
          <Frets x0={66} y0={26} frets={2} strings={2} width={96} />
          <circle cx={r.x} cy={26} r="8" fill={r.color} />
          <text x={r.x} y={30} textAnchor="middle" className="dg-mark">
            {r.mark}
          </text>
          <text x={176} y={24} className="dg-label" fill={r.color}>
            {r.text.split(':')[0]}
          </text>
          <text x={176} y={38} className="dg-label" fill="#8b95a5">
            {r.text.split(':')[1]}
          </text>
        </g>
      ))}
    </Figure>
  )
}

function OneFinger() {
  const colors = ['#4f8cff', '#34c759', '#ffb020', '#ff5ab4']
  const names = ['Index', 'Middle', 'Ring', 'Pinky']
  return (
    <Figure title="One finger per fret" caption="Each finger owns one fret of the position. The thumb sits behind the neck, roughly opposite the middle finger.">
      <Frets x0={40} y0={40} frets={4} strings={6} width={240} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx={70 + i * 60} cy={40 + 2 * 18} r="10" fill={colors[i]}>
            <animate attributeName="r" values="10;12;10" dur="1.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <text x={70 + i * 60} y={44 + 2 * 18} textAnchor="middle" className="dg-mark" fill="#0b0e13">
            {i + 1}
          </text>
          <text x={70 + i * 60} y={26} textAnchor="middle" className="dg-label" fill={colors[i]}>
            {names[i]}
          </text>
        </g>
      ))}
      <ellipse cx="130" cy="170" rx="22" ry="9" fill="none" stroke={SKIN} strokeDasharray="4 3" strokeWidth="2" />
      <Label x={158} y={174}>
        Thumb (behind neck)
      </Label>
    </Figure>
  )
}

function NeckSection({ x, thumbOver, title }: { x: number; thumbOver: boolean; title: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M-50 60 H50 V72 C50 120 -50 120 -50 72 Z" fill="#5a3d2b" stroke="#2c1d13" />
      <rect x="-50" y="54" width="100" height="8" fill="#2f2119" />
      {[-40, -24, -8, 8, 24, 40].map((sx) => (
        <circle key={sx} cx={sx} cy={52} r="2.2" fill="#d9d4c7" />
      ))}
      <ellipse cx="70" cy="110" rx="30" ry="38" fill={SKIN} stroke={SKIN_DARK} strokeWidth="2" />
      <Tube d="M62 82 C70 30 10 18 -8 46" w={14} />
      {thumbOver ? <Tube d="M52 132 C10 150 -70 120 -58 52" w={18} /> : <Tube d="M50 130 C30 140 8 130 0 120" w={18} />}
      <text x="0" y="168" textAnchor="middle" className="dg-label" fill="#e8ecf2">
        {title}
      </text>
    </g>
  )
}

function Thumb() {
  return (
    <Figure title="Thumb position (neck cross-section)" caption="Thumb behind the neck opens the hand for stretches, scales and sweeps. Thumb over the top gives leverage for bends and vibrato." viewBox="0 0 320 180">
      <NeckSection x={80} thumbOver={false} title="Behind: stretches/speed" />
      <NeckSection x={230} thumbOver title="Over top: bends/vibrato" />
      <Label x={4} y={16} color="#8b95a5">
        Fingertip arches over and presses down
      </Label>
    </Figure>
  )
}

function StringBend({ vibrato }: { vibrato?: boolean }) {
  const y = 80
  const bent = vibrato ? 7 : 20
  const dur = vibrato ? '0.4s' : '2.6s'
  const values = vibrato ? `0 0; 0 ${bent}; 0 0` : `0 0; 0 ${bent}; 0 ${bent}; 0 0; 0 0`
  const keyTimes = vibrato ? '0; 0.5; 1' : '0; 0.3; 0.6; 0.85; 1'
  const straight = `M20 ${y} L190 ${y} L300 ${y}`
  const curved = `M20 ${y} L190 ${y + bent} L300 ${y}`
  const dValues = vibrato ? `${straight}; ${curved}; ${straight}` : `${straight}; ${curved}; ${curved}; ${straight}; ${straight}`
  return (
    <Figure
      title={vibrato ? 'Wrist vibrato' : 'Supported bend'}
      caption={
        vibrato
          ? 'Small, even pushes driven by rotating the wrist with the index base anchored under the neck — not by wiggling the fingertip.'
          : 'Ring finger bends, middle and index push on the same string behind it. Rotate the wrist and push toward the low E.'
      }
    >
      <rect x="20" y="40" width="280" height="90" className="fb-wood" rx="3" />
      {[110, 150, 190, 230].map((fx) => (
        <line key={fx} x1={fx + 20} x2={fx + 20} y1="40" y2="130" className="fb-fret" />
      ))}
      <line x1="20" x2="300" y1={y - 26} y2={y - 26} className="dg-string" />
      <line x1="20" x2="300" y1={y + 26} y2={y + 26} className="dg-string" strokeWidth="2" />
      <path d={straight} className="dg-string dg-bent" fill="none">
        <animate attributeName="d" values={dValues} keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
      </path>
      <g>
        {[
          [110, '#4f8cff', 1],
          [150, '#34c759', 2],
          [190, '#ffb020', 3],
        ].map(([fx, color, n]) => (
          <g key={n as number}>
            <circle cx={fx as number} cy={y} r="10" fill={color as string} />
            <text x={fx as number} y={y + 4} textAnchor="middle" className="dg-mark" fill="#0b0e13">
              {n}
            </text>
          </g>
        ))}
        <animateTransform attributeName="transform" type="translate" values={values} keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
      </g>
      <Label x={20} y={y - 32}>
        B
      </Label>
      <Label x={20} y={y + 42}>
        D (toward low E ↓)
      </Label>
      <Label x={206} y={y - 6} color="#ffb020">
        G string
      </Label>
      {vibrato ? (
        <g transform="translate(40 150)">
          <path d="M0 10 q 10 -14 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0" fill="none" stroke={ACCENT} strokeWidth="2" />
          <Label x={232} y={14} color="#8b95a5">
            even pitch wave
          </Label>
        </g>
      ) : (
        <g transform="translate(40 152)">
          <Label x={0} y={10} color="#8b95a5">
            pitch:
          </Label>
          <rect x="40" y="2" width="160" height="8" rx="4" fill="#232a35" />
          <circle cx="200" cy="6" r="6" fill="none" stroke={GOOD} strokeWidth="2" />
          <circle cx="40" cy="6" r="5" fill={ACCENT}>
            <animate attributeName="cx" values="40; 200; 200; 40; 40" keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
          </circle>
          <Label x={210} y={10} color={GOOD}>
            target (fret 9)
          </Label>
        </g>
      )}
    </Figure>
  )
}

function PalmMute() {
  return (
    <Figure title="Palm muting" caption="Rest the fleshy outer edge of the picking hand right on the saddles. Slightly forward = chunkier; too far = dead thud.">
      <rect x="236" y="28" width="56" height="124" rx="6" fill="#3b4250" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <line x1="10" x2="250" y1={42 + i * 19} y2={42 + i * 19} className="dg-string" strokeWidth={0.9 + i * 0.4} />
          <rect x="244" y={37 + i * 19} width="12" height="10" rx="2" fill="#aab2bd" />
        </g>
      ))}
      <rect x="30" y="22" width="150" height="136" fill={BAD} opacity="0.08" />
      <rect x="196" y="22" width="44" height="136" fill={GOOD} opacity="0.14">
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
      </rect>
      <path d="M206 18 C250 30 262 90 254 166 L214 166 C206 110 196 60 206 18 Z" fill={SKIN} opacity="0.85" stroke={SKIN_DARK} strokeWidth="2" />
      <Label x={40} y={16} color={BAD}>
        too far forward: choked
      </Label>
      <Label x={190} y={176} color={GOOD}>
        sweet spot: on the saddles
      </Label>
      <Label x={252} y={20} color="#8b95a5">
        bridge
      </Label>
    </Figure>
  )
}

function Muting() {
  return (
    <Figure title="Muting unused strings" caption="Fretting hand: fingertip and the underside of the finger touch the higher strings. Picking hand: palm rests on the lower strings.">
      <Frets x0={20} y0={40} frets={4} strings={6} width={190} />
      <rect x="222" y="30" width="80" height="112" rx="6" fill="#262c36" />
      <ellipse cx="128" cy="78" rx="11" ry="30" fill={SKIN} opacity="0.9" stroke={SKIN_DARK} />
      <circle cx="128" cy="94" r="8" fill="#ffb020" />
      <text x="128" y="98" textAnchor="middle" className="dg-mark" fill="#0b0e13">
        3
      </text>
      {[40, 58, 76].map((y) => (
        <text key={y} x="148" y={y + 4} className="dg-x">
          ×
        </text>
      ))}
      <path d="M232 118 C260 110 296 116 300 150 L232 150 Z" fill={SKIN} opacity="0.85" stroke={SKIN_DARK} />
      {[112, 130].map((y) => (
        <text key={y} x="212" y={y + 4} className="dg-x">
          ×
        </text>
      ))}
      <line x1="20" x2="210" y1="94" y2="94" stroke={ACCENT} strokeWidth="3" opacity="0.7" />
      <Label x={20} y={20}>
        string 4 rings; × = kept silent
      </Label>
      <Label x={196} y={168}>
        picking palm mutes 5 & 6
      </Label>
    </Figure>
  )
}

function Tapping() {
  const steps = [
    { x: 250, color: '#ff5a5f', label: 'Tap 12 (R)', n: 'R' },
    { x: 70, color: '#4f8cff', label: 'Pull-off → 5', n: '1' },
    { x: 160, color: '#ff5ab4', label: 'Hammer 8', n: '4' },
  ]
  const values = (i: number) => steps.map((_, k) => (k === i ? 1 : 0.25)).join(';')
  return (
    <Figure title="Two-hand tapping" caption="Picking-hand finger taps the high note and pulls off sideways; the fretting hand catches the pull-off and hammers the next note.">
      <rect x="20" y="60" width="280" height="50" className="fb-wood" rx="3" />
      {[40, 100, 130, 190, 220, 280].map((fx) => (
        <line key={fx} x1={fx} x2={fx} y1="60" y2="110" className="fb-fret" />
      ))}
      <line x1="20" x2="300" y1="85" y2="85" className="dg-string" />
      {steps.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={85} r="11" fill={s.color}>
            <animate attributeName="opacity" values={values(i)} dur="1.2s" calcMode="discrete" repeatCount="indefinite" />
          </circle>
          <text x={s.x} y={89} textAnchor="middle" className="dg-mark" fill="#0b0e13">
            {s.n}
          </text>
          <text x={s.x} y={i % 2 ? 140 : 46} textAnchor="middle" className="dg-label" fill={s.color}>
            {s.label}
          </text>
        </g>
      ))}
      <Label x={20} y={170} color="#8b95a5">
        Fret numbers 5 · 8 · 12 on the B string
      </Label>
    </Figure>
  )
}

function Legato() {
  return (
    <Figure title="Hammer-on & pull-off" caption="Hammer: drop the fingertip fast, right behind the fret. Pull-off: flick the finger toward the floor so it plucks the string.">
      <Label x={10} y={18} color="#8b95a5">
        Side view — hammer-on
      </Label>
      <rect x="20" y="70" width="130" height="12" fill="#5a3d2b" />
      {[30, 80, 130].map((fx) => (
        <rect key={fx} x={fx} y="64" width="4" height="6" fill="#c9ccd1" />
      ))}
      <line x1="20" x2="150" y1="62" y2="62" className="dg-string" />
      <rect x="44" y="32" width="14" height="30" rx="7" fill="#4f8cff" />
      <rect x="110" y="0" width="14" height="30" rx="7" fill="#ffb020">
        <animate attributeName="y" values="4; 32; 32; 4" keyTimes="0; 0.15; 0.7; 1" dur="1.4s" repeatCount="indefinite" />
      </rect>
      <Label x={10} y={104} color="#8b95a5">
        Top view — pull-off
      </Label>
      <rect x="170" y="20" width="140" height="80" className="fb-wood" rx="3" />
      {[200, 260].map((fx) => (
        <line key={fx} x1={fx} x2={fx} y1="20" y2="100" className="fb-fret" />
      ))}
      <path d="M170 50 L250 50 L310 50" className="dg-string" fill="none">
        <animate attributeName="d" values="M170 50 L250 50 L310 50; M170 50 L250 64 L310 50; M170 50 L250 50 L310 50" keyTimes="0; 0.5; 0.55" dur="1.4s" repeatCount="indefinite" />
      </path>
      <circle cx="192" cy="50" r="9" fill="#4f8cff" />
      <circle cx="250" cy="50" r="9" fill="#ffb020">
        <animate attributeName="cy" values="50; 64; 86; 50" keyTimes="0; 0.5; 0.6; 1" dur="1.4s" repeatCount="indefinite" />
      </circle>
      <path d="M266 58 v22 l-4 -6 m4 6 l4 -6" stroke={GOOD} fill="none" strokeWidth="1.6" />
      <Label x={274} y={78} color={GOOD}>
        flick
      </Label>
      <Label x={20} y={130}>
        Index stays planted
      </Label>
      <Label x={20} y={146}>
        Ring finger does the work
      </Label>
      <Label x={180} y={130}>
        Toward the floor =
      </Label>
      <Label x={180} y={146}>
        strong pull-off note
      </Label>
    </Figure>
  )
}

const DIAGRAMS: Record<DiagramId, () => ReactNode> = {
  pickGrip: PickGrip,
  pickAngle: PickAngle,
  alternate: Alternate,
  economy: Economy,
  sweep: Sweep,
  hybrid: Hybrid,
  fretPlacement: FretPlacement,
  oneFinger: OneFinger,
  thumb: Thumb,
  bend: () => <StringBend />,
  vibrato: () => <StringBend vibrato />,
  palmMute: PalmMute,
  muting: Muting,
  tapping: Tapping,
  legato: Legato,
}

export function Diagram({ id }: { id: DiagramId }) {
  const C = DIAGRAMS[id]
  return <C />
}
