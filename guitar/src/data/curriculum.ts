import { parseTab, type PickingMode, type TabEvent } from '../music/notation'

export type LevelId = 'intermediate' | 'advanced' | 'pro' | 'master'
export type Category = 'fretting' | 'picking' | 'lead' | 'riff'
export type DiagramId =
  | 'pickGrip'
  | 'pickAngle'
  | 'alternate'
  | 'economy'
  | 'sweep'
  | 'hybrid'
  | 'fretPlacement'
  | 'oneFinger'
  | 'thumb'
  | 'bend'
  | 'vibrato'
  | 'palmMute'
  | 'muting'
  | 'tapping'
  | 'legato'

export interface Level {
  id: LevelId
  name: string
  tagline: string
  goals: string[]
}

export interface Exercise {
  id: string
  title: string
  tab: string
  picking?: PickingMode
  startBpm: number
  goalBpm: number
  drive?: boolean
  tip?: string
}

export interface Lesson {
  id: string
  level: LevelId
  category: Category
  title: string
  summary: string
  diagrams: DiagramId[]
  leftHand: string[]
  rightHand: string[]
  steps: string[]
  mistakes: string[]
  exercises: Exercise[]
  /** MIDI root for the improvisation drone (lead lessons). */
  droneRoot?: number
}

export const LEVELS: Level[] = [
  {
    id: 'intermediate',
    name: 'Intermediate',
    tagline: 'Clean fundamentals for leads & riffs',
    goals: [
      'Alternate-pick 16th notes cleanly at 90 BPM',
      'Play minor pentatonic box 1 from memory',
      'Bend a whole step in tune and add steady vibrato',
      'Tight palm-muted power-chord riffs',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    tagline: 'The whole neck, legato and real riff vocabulary',
    goals: [
      'Connect all pentatonic positions and slide between them',
      '3-notes-per-string scales picked and legato',
      'Gallop and string-skipping riffs in time',
      'Unison and double-stop bends, triad arpeggios',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Speed, sweeps, tapping and modal colour',
    goals: [
      'Pentatonic sixes and scale sequences at 16th-triplet speed',
      'Clean 3- and 5-string sweeps',
      'Two-hand tapping and hybrid picking',
      'Phrase with Dorian, Mixolydian and harmonic minor',
    ],
  },
  {
    id: 'master',
    name: 'Ultimate Pro',
    tagline: 'Signature-level technique and musicianship',
    goals: [
      'Sweep + tap arpeggios and wide-stretch legato',
      'Pinch harmonics and compound bends on command',
      'Outside/chromatic lines that resolve convincingly',
      'Odd-meter riffs locked to the click at speed',
    ],
  },
]

export const CATEGORY_LABEL: Record<Category, string> = {
  fretting: 'Fretting hand',
  picking: 'Picking hand',
  lead: 'Leads',
  riff: 'Riffs',
}

type P = [number, number, number | 'R']
const tok = ([s, f, g]: P, flags = '') => `${s}:${f}:${g}${flags}`

const PENT_BOX1: P[] = [
  [6, 5, 1], [6, 8, 4], [5, 5, 1], [5, 7, 3], [4, 5, 1], [4, 7, 3],
  [3, 5, 1], [3, 7, 3], [2, 5, 1], [2, 8, 4], [1, 5, 1], [1, 8, 4],
]
const PENT_BOX2: P[] = [
  [6, 8, 2], [6, 10, 4], [5, 7, 1], [5, 10, 4], [4, 7, 1], [4, 10, 4],
  [3, 7, 1], [3, 9, 3], [2, 8, 2], [2, 10, 4], [1, 8, 2], [1, 10, 4],
]
const BLUES_BOX1: P[] = [
  [6, 5, 1], [6, 8, 4], [5, 5, 1], [5, 6, 2], [5, 7, 3], [4, 5, 1], [4, 7, 3],
  [3, 5, 1], [3, 7, 3], [3, 8, 4], [2, 5, 1], [2, 8, 4], [1, 5, 1], [1, 8, 4],
]
/** A natural minor, three notes per string from the 5th fret. */
const MINOR_3NPS: P[] = [
  [6, 5, 1], [6, 7, 3], [6, 8, 4], [5, 5, 1], [5, 7, 3], [5, 8, 4],
  [4, 5, 1], [4, 7, 2], [4, 9, 4], [3, 5, 1], [3, 7, 2], [3, 9, 4],
  [2, 6, 1], [2, 8, 2], [2, 10, 4], [1, 7, 1], [1, 8, 2], [1, 10, 4],
]

function upDown(shape: P[], dur = 8): string {
  const down = [...shape].reverse().slice(1)
  return `@${dur} ${[...shape, ...down].map((p) => tok(p)).join(' ')}`
}

function legato3nps(shape: P[]): string {
  const up: string[] = []
  for (let i = 0; i < shape.length; i++) up.push(tok(shape[i], i % 3 === 0 ? '' : 'h'))
  const rev = [...shape].reverse()
  const down: string[] = []
  for (let i = 0; i < rev.length; i++) down.push(tok(rev[i], i % 3 === 0 ? '' : 'p'))
  return `@16 ${up.join(' ')} ${down.join(' ')}`
}

function fours(shape: P[], dur = 16): string {
  const out: string[] = []
  for (let i = 0; i + 4 <= shape.length; i++) out.push(...shape.slice(i, i + 4).map((p) => tok(p)))
  return `@${dur} ${out.join(' ')}`
}

function sixes(shape: P[]): string {
  const desc = [...shape].reverse()
  const out: string[] = []
  for (let i = 0; i + 6 <= desc.length; i += 2) out.push(...desc.slice(i, i + 6).map((p) => tok(p)))
  return `@24 ${out.join(' ')}`
}

function chromatic(fret: number): string {
  const up: string[] = []
  for (let s = 6; s >= 1; s--) for (let g = 1; g <= 4; g++) up.push(`${s}:${fret + g - 1}:${g}`)
  const down: string[] = []
  for (let s = 1; s <= 6; s++) for (let g = 4; g >= 1; g--) down.push(`${s}:${fret + g}:${g}`)
  return `@16 ${up.join(' ')} ${down.join(' ')}`
}

function spider(fret: number): string {
  const out: string[] = []
  for (let s = 6; s >= 2; s--)
    out.push(`${s}:${fret}:1`, `${s - 1}:${fret + 2}:3`, `${s}:${fret + 1}:2`, `${s - 1}:${fret + 3}:4`)
  return `@16 ${out.join(' ')}`
}

const repeat = (s: string, n: number) => Array.from({ length: n }, () => s).join(' ')

export const LESSONS: Lesson[] = [
  // ───────────────────────── INTERMEDIATE ─────────────────────────
  {
    id: 'int-pick-grip',
    level: 'intermediate',
    category: 'picking',
    title: 'Pick grip & strict alternate picking',
    summary:
      'Every fast lead starts with an efficient grip and a small, relaxed motion. Lock this in before chasing speed.',
    diagrams: ['pickGrip', 'pickAngle', 'alternate'],
    leftHand: ['Fret each note with the fingertip, just behind the fret wire.', 'Lift fingers only a few millimetres between notes.'],
    rightHand: [
      'Hold the pick between the pad of the thumb and the side of the index finger’s first joint.',
      'Show only 2–3 mm of pick tip — less pick = less string resistance.',
      'Angle the pick edge slightly (about 20–30°) so it glides through the string.',
      'Move from the wrist, not the elbow or fingers. Keep the motion tiny.',
      'Lightly anchor the side of your palm or pinky for reference — never press.',
    ],
    steps: [
      'Set the metronome at the start tempo and play 16th notes (4 per click) on one note.',
      'Alternate strictly: down, up, down, up. Downstrokes land on the click.',
      'When you can play 30 seconds cleanly and relaxed, raise the tempo by 4–5 BPM.',
      'Move to the string-crossing pattern — keep the same tiny wrist motion across strings.',
    ],
    mistakes: [
      'Gripping the pick so hard the forearm tenses — grip just enough not to drop it.',
      'Big “windmill” strokes that travel far past the string.',
      'Speeding up before the notes are even — record yourself and listen.',
    ],
    exercises: [
      {
        id: 'int-pick-tremolo',
        title: '16th notes on one string',
        tab: `@16 ${repeat('2:5:1', 16)} ${repeat('2:7:3', 16)}`,
        startBpm: 60,
        goalBpm: 110,
        tip: 'Downstrokes on every click. Stay loose.',
      },
      {
        id: 'int-pick-cross',
        title: 'String-crossing 16ths',
        tab: `@16 ${repeat('3:5:1 3:7:3 2:5:1 2:8:4', 4)} ${repeat('2:8:4 2:5:1 3:7:3 3:5:1', 4)}`,
        startBpm: 55,
        goalBpm: 100,
        tip: 'Notice the upstroke changing strings — keep it small.',
      },
    ],
  },
  {
    id: 'int-fretting-basics',
    level: 'intermediate',
    category: 'fretting',
    title: 'One finger per fret & fingertip placement',
    summary:
      'Accurate fingertip placement gives clean tone with minimum pressure — the foundation of fast, relaxed playing.',
    diagrams: ['fretPlacement', 'oneFinger', 'thumb'],
    leftHand: [
      'Assign one finger to each fret: index = fret 1 of the position, middle = 2, ring = 3, pinky = 4.',
      'Press with the tip of the finger right behind the fret wire (not on top of it, not in the middle).',
      'Keep fingers curved like a hammer so they don’t touch neighbouring strings.',
      'Thumb rests behind the neck roughly behind the middle finger.',
      'Use the minimum pressure needed — find the point the buzz disappears, then add a touch more.',
    ],
    rightHand: ['Alternate pick every note.', 'Rest the palm lightly on the low strings to keep them quiet.'],
    steps: [
      'Play the chromatic 1-2-3-4 pattern slowly — fingers hover close to the strings.',
      'Leave each finger down until the next string (or as long as it doesn’t tense the hand).',
      'Play the spider exercise: it trains finger independence by crossing strings in pairs.',
      'Speed up only when every note rings clearly with no buzz.',
    ],
    mistakes: [
      'Pinky flying far off the fretboard — keep it hovering.',
      'Collapsing the first knuckle (flat fingers) which mutes the string below.',
      'Squeezing with the thumb. Relax the thumb, let arm weight help.',
    ],
    exercises: [
      { id: 'int-chromatic', title: 'Chromatic 1-2-3-4 (5th position)', tab: chromatic(5), startBpm: 50, goalBpm: 100 },
      { id: 'int-spider', title: 'Spider: 1-3 / 2-4 finger independence', tab: spider(5), startBpm: 45, goalBpm: 90 },
    ],
  },
  {
    id: 'int-pent-box1',
    level: 'intermediate',
    category: 'lead',
    title: 'Minor pentatonic box 1 (A minor)',
    summary: 'The single most-used lead shape in rock, blues and metal. Learn the fingering exactly — it sets up bends later.',
    diagrams: ['oneFinger'],
    leftHand: [
      'Index finger owns the 5th fret on every string.',
      'Ring finger plays the 7th fret; pinky plays the 8th fret (on the low E, B and high E strings).',
      'The root note A is at the 5th fret low E, 7th fret D string and 5th fret high E.',
    ],
    rightHand: ['Alternate pick throughout.', 'Mute strings you’re not playing with the side of your picking palm.'],
    steps: [
      'Play the shape up and down in 8th notes and say the root notes aloud as you hit them.',
      'Watch the finger numbers on the animated fretboard — copy them exactly.',
      'Play it with the drone in A and start making short 3–4 note phrases.',
    ],
    mistakes: ['Using the ring finger for the 8th fret on the B string (save that for bends later).', 'Rushing the descending side.'],
    droneRoot: 45,
    exercises: [
      { id: 'int-box1', title: 'Box 1 up & down', tab: upDown(PENT_BOX1), startBpm: 60, goalBpm: 120 },
      {
        id: 'int-box1-threes',
        title: 'Box 1 in groups of three (triplets)',
        tab: `@12 ${PENT_BOX1.slice(0, 10)
          .map((_, i) => PENT_BOX1.slice(i, i + 3).map((p) => tok(p)).join(' '))
          .join(' ')}`,
        startBpm: 55,
        goalBpm: 110,
        tip: 'Each click starts a new group — the accent moves through the shape.',
      },
    ],
  },
  {
    id: 'int-bends',
    level: 'intermediate',
    category: 'lead',
    title: 'Bending in tune & releasing',
    summary: 'Bends are the voice of rock guitar. An out-of-tune bend ruins a great lick — train your ear and your support fingers.',
    diagrams: ['bend', 'thumb'],
    leftHand: [
      'Bend with the ring finger, with the middle and index on the same string behind it pushing too.',
      'Hook the thumb over the top of the neck for leverage (the “baseball grip”).',
      'Push the string toward the ceiling (toward the low E) on the G, B and high E strings.',
      'Rotate from the wrist like turning a doorknob — don’t just push with the fingers.',
    ],
    rightHand: ['Pick once, then let the bend sing.', 'Mute the strings below with the picking palm so they don’t ring as you push.'],
    steps: [
      'First play the target note (two frets higher) to hear the pitch.',
      'Then bend the lower note until it matches that pitch exactly.',
      'Hold the bend, then release slowly back down without picking again.',
      'Repeat on the B string: target fret 10, bend from fret 8.',
    ],
    mistakes: ['Under-bending (flat) — the most common problem, check against the target note.', 'Letting other strings ring while bending.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'int-bend-pitch',
        title: 'Bend to pitch — G & B strings',
        tab: '@4 3:9:3 @2 3:7:3b2 @4 3:7:3r 3:5:1 | @4 2:10:3 @2 2:8:3b2 @4 2:8:3r 2:5:1',
        startBpm: 60,
        goalBpm: 80,
        drive: true,
        tip: 'Match the bend to the reference note you just played.',
      },
      {
        id: 'int-bend-lick',
        title: 'Bend–release–pull-off lick',
        tab: '@8 2:8:3b2 2:8:3r 2:5:1p 3:7:3 @16 3:5:1 3:7:3 @4 4:7:3~ @8 - -',
        startBpm: 60,
        goalBpm: 100,
        drive: true,
      },
    ],
  },
  {
    id: 'int-vibrato',
    level: 'intermediate',
    category: 'lead',
    title: 'Wrist vibrato',
    summary: 'A controlled, even vibrato is the signature of a pro player. It comes from the wrist, not the fingers.',
    diagrams: ['vibrato', 'thumb'],
    leftHand: [
      'Anchor the base of your index finger against the underside of the neck.',
      'Rotate the wrist (like shaking water off your hand) to push the string up and back.',
      'Aim for a quarter-tone to a half-tone of width, evenly spaced in time.',
      'Use ring finger with support from middle and index, same as bending.',
    ],
    rightHand: ['Pick once firmly, then mute other strings with the palm.'],
    steps: [
      'Play a long note and add slow vibrato in time with 8th notes.',
      'Then try 16th-note speed. Keep the width consistent.',
      'Add vibrato on top of a held bend — the hardest and most expressive version.',
    ],
    mistakes: ['Nervous, tiny “finger wiggle” vibrato.', 'Vibrato that goes flat below the note on a bend.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'int-vib-long',
        title: 'Long notes with vibrato',
        tab: '@2 3:7:3~ 2:8:3~ | 1:5:1~ 4:7:3~',
        startBpm: 60,
        goalBpm: 80,
        drive: true,
        tip: 'Count the vibrato pulses — make them even.',
      },
      { id: 'int-vib-bend', title: 'Bent vibrato', tab: '@1 3:7:3b2~ | 2:8:3b2~', startBpm: 60, goalBpm: 70, drive: true },
    ],
  },
  {
    id: 'int-legato',
    level: 'intermediate',
    category: 'fretting',
    title: 'Hammer-ons & pull-offs',
    summary: 'Legato gives smooth, fast lines with less picking. Volume must match picked notes.',
    diagrams: ['legato'],
    leftHand: [
      'Hammer-on: bring the fingertip down quickly and firmly just behind the fret — like a small hammer.',
      'Pull-off: pull the finger slightly down (toward the floor) so it plucks the string, not just lifts off.',
      'Keep the lower finger planted while the higher finger hammers or pulls.',
    ],
    rightHand: ['Pick only the first note of each group.', 'Mute idle strings — legato makes noise very obvious.'],
    steps: [
      'Practise the trill: index on 5, ring hammers 7 and pulls back. Keep all notes equal volume.',
      'Play the descending pentatonic legato run — pick the first note on each string, pull off the second.',
    ],
    mistakes: ['Pull-offs that just lift (weak notes).', 'Hammers that land in the middle of the fret (thin tone).'],
    exercises: [
      {
        id: 'int-trill',
        title: 'Hammer/pull trill (index–ring, index–pinky)',
        tab: `@16 ${repeat('3:5:1 3:7:3h 3:5:1p 3:7:3h', 4)} ${repeat('3:5:1 3:8:4h 3:5:1p 3:8:4h', 4)}`,
        picking: 'down',
        startBpm: 60,
        goalBpm: 110,
      },
      {
        id: 'int-legato-pent',
        title: 'Descending pentatonic pull-offs',
        tab: '@12 1:8:4 1:5:1p 2:8:4 2:5:1p 3:7:3 3:5:1p 4:7:3 4:5:1p 5:7:3 5:5:1p 6:8:4 6:5:1p @4 6:5:1~',
        startBpm: 60,
        goalBpm: 120,
        drive: true,
      },
    ],
  },
  {
    id: 'int-palm-mute',
    level: 'intermediate',
    category: 'riff',
    title: 'Palm muting & power-chord riffs',
    summary: 'Tight palm muting is what makes riffs sound heavy and controlled. Downstrokes give the chunk.',
    diagrams: ['palmMute', 'muting'],
    leftHand: [
      'E5 open: low E open + index on fret 2 of the A string.',
      'Moveable power chord: index on the low E root, ring finger two frets higher on the A string.',
      'Let the index finger lightly touch the strings below to mute them.',
    ],
    rightHand: [
      'Rest the fleshy edge of your picking palm on the strings right where they meet the bridge saddles.',
      'Too far forward = choked “thud”; too far back = no mute. Find the sweet spot.',
      'Use downstrokes for the chugs. Lift the palm off for accented power chords.',
    ],
    steps: [
      'Chug the open low E in 8th notes with downstrokes — every note the same volume.',
      'Play the riff: lift the palm for each power chord, then return immediately.',
      'Speed up only while each chug stays tight and even.',
    ],
    mistakes: ['Palm too far onto the strings so the pitch goes sharp/choked.', 'Chords bleeding into the next chug.'],
    exercises: [
      {
        id: 'int-chug-riff',
        title: 'Downpicked chug riff in E',
        tab: '@8 6:0:0m 6:0:0m 6:0:0m 6:0:0m 6:3:1+5:5:3 6:0:0m 6:5:1+5:7:3 6:0:0m | 6:0:0m 6:0:0m 6:0:0m 6:0:0m 6:3:1+5:5:3 6:5:1+5:7:3 @4 6:1:1+5:3:3',
        picking: 'down',
        startBpm: 80,
        goalBpm: 160,
        drive: true,
      },
      {
        id: 'int-octave-riff',
        title: 'Octave riff with muted strings',
        tab: '@8 5:7:1+3:9:3 - 5:7:1+3:9:3 5:10:1+3:12:3 - 5:10:1+3:12:3 5:12:1+3:14:3 5:10:1+3:12:3',
        picking: 'down',
        startBpm: 70,
        goalBpm: 130,
        drive: true,
        tip: 'Index underside mutes the D string between the octave notes.',
      },
    ],
  },
  {
    id: 'int-pent-riffs',
    level: 'intermediate',
    category: 'riff',
    title: 'Single-note pentatonic riffs',
    summary: 'Most classic riffs are just the minor pentatonic played with attitude, muting and rhythm.',
    diagrams: ['palmMute'],
    leftHand: ['Open position: middle finger on fret 2, ring finger on fret 3.', 'Hammer from the open string for a fluid feel.'],
    rightHand: ['Palm mute the open low E; release for the fretted notes.', 'Alternate pick the 8ths: down on the beat, up on the “and”.'],
    steps: ['Learn the riff slowly with the tab cursor.', 'Then play it along with the click — feel where the accents fall.'],
    mistakes: ['Letting the open low E ring under the fretted notes.'],
    droneRoot: 40,
    exercises: [
      {
        id: 'int-epent-riff',
        title: 'E minor pentatonic riff',
        tab: '@8 6:0:0m 6:0:0m 6:3:3 6:0:0m 5:0:0 5:2:2h 6:0:0m 6:3:3 | 6:0:0m 6:0:0m 5:2:2 5:0:0 6:3:3 6:0:0m @4 4:2:2~',
        startBpm: 70,
        goalBpm: 140,
        drive: true,
      },
    ],
  },
  {
    id: 'int-licks',
    level: 'intermediate',
    category: 'lead',
    title: 'Blues-rock lick vocabulary (box 1)',
    summary: 'Licks are the words of soloing. Learn these, then mix and vary them over the drone.',
    diagrams: ['bend'],
    leftHand: ['Pinky on fret 8 for the fast triplet run; switch to ring for bends.'],
    rightHand: ['Pick the first note of each triplet group harder for a driving feel.'],
    steps: ['Loop each lick until it’s automatic.', 'Change one thing (rhythm, last note, bend) to make it your own.'],
    mistakes: ['Playing licks with no dynamics — vary pick attack.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'int-lick-triplet',
        title: 'Classic descending triplet run',
        tab: '@12 1:8:4 1:5:1p 2:8:4 1:8:4 1:5:1p 2:8:4 2:8:4 2:5:1p 3:7:3 2:8:4 2:5:1p 3:7:3 @4 3:7:3b2~ @2 -',
        startBpm: 60,
        goalBpm: 120,
        drive: true,
      },
      {
        id: 'int-lick-answer',
        title: 'Call & answer lick',
        tab: '@8 1:5:1 2:8:4 2:5:1 2:8:3b2 @4 2:8:3r @8 2:5:1p 3:7:3 | @16 3:5:1 3:7:3 4:7:3 4:5:1 @8 5:7:3 5:5:1p 5:7:3h @2 4:7:3~',
        startBpm: 60,
        goalBpm: 110,
        drive: true,
      },
    ],
  },

  // ───────────────────────── ADVANCED ─────────────────────────
  {
    id: 'adv-pent-positions',
    level: 'advanced',
    category: 'lead',
    title: 'Pentatonic positions & connecting the neck',
    summary: 'Break out of box 1. Shape 2 sits right above it and a diagonal run links the low and high registers.',
    diagrams: ['oneFinger', 'thumb'],
    leftHand: [
      'Box 2 starts with the index on fret 7; middle on 8, ring on 9, pinky on 10.',
      'On slides, keep the same finger pressure moving — don’t lift.',
      'When shifting position, move the whole hand with the thumb, not just a stretched finger.',
    ],
    rightHand: ['Alternate pick, but let slides carry notes without re-picking.'],
    steps: [
      'Play box 2 up and down. Then alternate box 1 and box 2 without stopping.',
      'Learn the diagonal run — it moves from the 5th fret to the 15th fret.',
      'Improvise over the drone using only notes on two strings, travelling up and down the neck.',
    ],
    mistakes: ['Looking at the hand for every shift — glance at the target fret before moving.'],
    droneRoot: 45,
    exercises: [
      { id: 'adv-box2', title: 'Box 2 up & down', tab: upDown(PENT_BOX2), startBpm: 60, goalBpm: 120 },
      {
        id: 'adv-diagonal',
        title: 'Diagonal run (5th → 15th fret)',
        tab: '@8 5:5:1 5:7:3 4:5:1 4:7:3 4:10:3s 3:9:1 3:12:4 2:10:1 2:13:4 1:12:1 @4 1:15:4~ @8 -',
        startBpm: 60,
        goalBpm: 120,
        drive: true,
      },
    ],
  },
  {
    id: 'adv-blues-phrasing',
    level: 'advanced',
    category: 'lead',
    title: 'Blues scale & phrasing',
    summary: 'The b5 “blue note” adds tension. Phrasing — space, rhythm and dynamics — matters more than notes.',
    diagrams: ['bend', 'vibrato'],
    leftHand: ['Blue note on the A string fret 6 (middle) and G string fret 8 (pinky).', 'Pass through the b5 — rarely sit on it.'],
    rightHand: ['Vary pick attack: soft for the call, hard for the answer.'],
    steps: [
      'Play the blues scale up and down.',
      'Play the phrasing lick and leave a full beat of silence after it.',
      'Over the drone: play a 1-bar “call”, rest, then a 1-bar “answer”.',
    ],
    mistakes: ['Filling every beat with notes.', 'Ending phrases on the b5.'],
    droneRoot: 45,
    exercises: [
      { id: 'adv-blues-scale', title: 'Blues scale box 1', tab: upDown(BLUES_BOX1), startBpm: 60, goalBpm: 120 },
      {
        id: 'adv-blue-lick',
        title: 'Blue-note phrasing lick',
        tab: '@16 3:5:1 3:7:3 3:8:4h 3:7:3p 3:5:1p 4:7:3 @8 4:5:1 5:7:3 5:6:2p 5:5:1p @4 6:8:4~ @2 -',
        startBpm: 60,
        goalBpm: 110,
        drive: true,
      },
    ],
  },
  {
    id: 'adv-3nps',
    level: 'advanced',
    category: 'picking',
    title: '3-notes-per-string scales (A minor)',
    summary: 'Three notes per string gives even picking patterns — the backbone of shred scale runs.',
    diagrams: ['alternate', 'oneFinger'],
    leftHand: [
      'Half-step + whole-step strings (low E, A): fingers 1-3-4.',
      'Whole-whole strings (D, G, B, high E): fingers 1-2-4 with a slight stretch.',
      'Shift the hand up one fret moving to the B string.',
    ],
    rightHand: [
      'Strict alternate picking: each string starts with the opposite stroke from the last one.',
      'Keep the motion from the wrist; let the pick angle help string changes.',
    ],
    steps: ['Ascend and descend in 16ths at a slow tempo.', 'Accent each beat to lock the 16ths to the click.', 'Then practise in groups of four (sequence).'],
    mistakes: ['Losing the alternation on string changes.', 'Collapsing the 1-2-4 stretch.'],
    droneRoot: 45,
    exercises: [
      { id: 'adv-3nps-scale', title: '3nps A minor up & down', tab: upDown(MINOR_3NPS, 16), startBpm: 60, goalBpm: 120 },
      { id: 'adv-3nps-fours', title: 'Sequence in fours', tab: fours(MINOR_3NPS), startBpm: 55, goalBpm: 110 },
    ],
  },
  {
    id: 'adv-legato-3nps',
    level: 'advanced',
    category: 'fretting',
    title: 'Legato scale runs',
    summary: 'Pick once per string and let the fretting hand do the rest — fluid, singing runs.',
    diagrams: ['legato', 'muting'],
    leftHand: [
      'Hammer from the fingertip with speed, not force.',
      'Pull-offs flick slightly toward the floor.',
      'Index finger lightly touches the higher strings to mute them.',
    ],
    rightHand: ['Pick only the first note per string.', 'Palm rests on the lower strings for muting.'],
    steps: ['Play the ascending legato line, then the descending.', 'Make every note the same volume — record and check.'],
    mistakes: ['Notes getting quieter as you go across the string.'],
    exercises: [
      { id: 'adv-legato-run', title: '3nps legato up & down', tab: legato3nps(MINOR_3NPS), startBpm: 60, goalBpm: 130, drive: true },
    ],
  },
  {
    id: 'adv-gallop',
    level: 'advanced',
    category: 'riff',
    title: 'Gallops & string-skipping riffs',
    summary: 'The gallop (8th + two 16ths) and pedal-tone string skipping are the backbone of metal riffing.',
    diagrams: ['palmMute', 'alternate'],
    leftHand: ['Power chords with index + ring; pedal riffs: index fret 2, ring 4, pinky 5 on the D string.'],
    rightHand: [
      'Gallop picking: Down – Down Up (the 8th note gets a down, the two 16ths down-up).',
      'For string skipping, lift the pick slightly over the skipped string.',
    ],
    steps: ['Loop the gallop on open E until even.', 'Add the chords.', 'Learn the pedal riff — low E stays palm-muted, upper notes ring.'],
    mistakes: ['Rushing the 16ths in the gallop.'],
    droneRoot: 40,
    exercises: [
      {
        id: 'adv-gallop-riff',
        title: 'Gallop riff in E',
        tab: '@8 6:0:0mD @16 6:0:0mD 6:0:0mU @8 6:0:0mD @16 6:0:0mD 6:0:0mU @8 6:3:1+5:5:3D @16 6:0:0mD 6:0:0mU @8 6:5:1+5:7:3D @16 6:0:0mD 6:0:0mU',
        startBpm: 70,
        goalBpm: 150,
        drive: true,
      },
      {
        id: 'adv-skip-riff',
        title: 'Pedal-tone string-skip riff',
        tab: '@16 6:0:0m 4:2:1 6:0:0m 4:4:3 6:0:0m 4:5:4 6:0:0m 4:4:3 6:0:0m 4:2:1 6:0:0m 4:4:3 6:0:0m 4:5:4 4:4:3 4:2:1',
        startBpm: 60,
        goalBpm: 130,
        drive: true,
      },
    ],
  },
  {
    id: 'adv-bends',
    level: 'advanced',
    category: 'lead',
    title: 'Unison & double-stop bends',
    summary: 'Two notes at once for a huge sound: the unison bend and Chuck-Berry-style double stops.',
    diagrams: ['bend'],
    leftHand: [
      'Unison bend: index on B string fret 5 stays still, ring (supported) bends G string fret 7 up a whole step to match.',
      'Double stop: index flattens across B and high E at the same fret.',
    ],
    rightHand: ['Pick both strings together; mute everything else.'],
    steps: ['Bend slowly until the two notes stop “beating” against each other — that’s in tune.', 'Then try the double-stop phrase.'],
    mistakes: ['Pushing the index finger off the B string as the G string bends.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'adv-unison',
        title: 'Unison bends',
        tab: '@2 3:7:3b2+2:5:1 @4 3:7:3r+2:5:1 - | @2 2:10:3b2+1:8:1 @4 2:10:3r+1:8:1 -',
        startBpm: 60,
        goalBpm: 90,
        drive: true,
      },
      {
        id: 'adv-doublestop',
        title: 'Double-stop phrase',
        tab: '@8 2:5:1+1:5:1 2:5:1+1:5:1 2:8:3+1:8:4 2:8:3+1:8:4 3:7:3+2:8:4 3:5:1+2:5:1 @4 4:7:3+3:7:3~',
        startBpm: 70,
        goalBpm: 130,
        drive: true,
      },
    ],
  },
  {
    id: 'adv-triads',
    level: 'advanced',
    category: 'lead',
    title: 'Triad arpeggios on the top 3 strings',
    summary: 'Arpeggios outline chords — the key to melodic solos that follow the harmony. Three A-minor shapes up the neck.',
    diagrams: ['economy', 'sweep'],
    leftHand: [
      '5th fret: index rolls across G, B, E (rolling barre — lift the pad as you move so notes don’t ring together).',
      '8th fret: middle (G 9), ring (B 10), index (E 8).',
      '12th fret: ring (G 14), middle (B 13), index (E 12).',
    ],
    rightHand: ['Economy motion: one continuous push down through the strings, one pull back up.'],
    steps: ['Play each shape as triplets, then connect all three.', 'Let each note stop as the next starts — no chord ringing.'],
    mistakes: ['Notes ringing together (sounds like a strum, not an arpeggio).'],
    droneRoot: 45,
    exercises: [
      {
        id: 'adv-triad-shapes',
        title: 'A minor triads — 3 shapes',
        tab: '@12 3:5:1 2:5:1 1:5:1 2:5:1 3:5:1 2:5:1 3:9:2 2:10:3 1:8:1 2:10:3 3:9:2 2:10:3 3:14:3 2:13:2 1:12:1 2:13:2 3:14:3 2:13:2 @4 3:14:3~',
        picking: 'economy',
        startBpm: 55,
        goalBpm: 110,
      },
    ],
  },
  {
    id: 'adv-economy',
    level: 'advanced',
    category: 'picking',
    title: 'Economy picking',
    summary: 'Use the direction of travel: when changing strings, keep moving the same way instead of reversing.',
    diagrams: ['economy', 'pickAngle'],
    leftHand: ['Same 3nps fingering as before.'],
    rightHand: [
      'Ascending (toward the floor): the first note on the new string is a downstroke, continuing the motion.',
      'Descending: the first note on the new string is an upstroke.',
      'Keep the timing even — the “sweep” between strings must not rush.',
    ],
    steps: ['Compare strict alternate vs economy on the same scale — feel the difference.', 'Use a metronome to keep the string changes in time.'],
    mistakes: ['Rushing the two-in-a-row strokes so the rhythm lurches.'],
    exercises: [
      { id: 'adv-econ-scale', title: '3nps with economy picking', tab: upDown(MINOR_3NPS, 16), picking: 'economy', startBpm: 60, goalBpm: 130 },
    ],
  },

  // ───────────────────────── PRO ─────────────────────────
  {
    id: 'pro-sixes',
    level: 'pro',
    category: 'lead',
    title: 'Pentatonic sixes',
    summary: 'The famous descending pentatonic sequence in 16th-note triplets — fast, fluid and built from box 1.',
    diagrams: ['alternate'],
    leftHand: ['Box 1 fingering: index 5, ring 7, pinky 8.', 'Fingers barely leave the strings.'],
    rightHand: ['Strict alternate picking. Six notes per beat.', 'Practise in bursts: one beat on, one beat off.'],
    steps: ['Play one group of six slowly, then add the next.', 'Accent the first note of each group to stay in time.'],
    mistakes: ['Tension creeping in as speed rises — stop, shake out, restart slower.'],
    droneRoot: 45,
    exercises: [
      { id: 'pro-sixes-ex', title: 'Descending pentatonic sixes', tab: sixes(PENT_BOX1), startBpm: 50, goalBpm: 110, drive: true },
    ],
  },
  {
    id: 'pro-speed',
    level: 'pro',
    category: 'picking',
    title: 'Speed bursts & sequences',
    summary: 'Speed is built in short bursts with full relaxation in between. Then extend the burst.',
    diagrams: ['alternate', 'pickAngle'],
    leftHand: ['Synchronisation: the fretting finger lands at the exact instant the pick strikes.'],
    rightHand: [
      'Pick slant: tilt the pick so it naturally escapes the strings on the stroke that changes string.',
      'Keep the motion tiny and from the wrist/forearm rotation.',
    ],
    steps: [
      'Play the burst exercise: 4 fast notes, then rest. Relax fully in the rest.',
      'Raise the tempo 5 BPM at a time. When it breaks, go back 10 BPM.',
      'Then play the scale sequence in fours at 16ths.',
    ],
    mistakes: ['Hands out of sync (picks before the fret is pressed) — slow down.'],
    exercises: [
      {
        id: 'pro-burst',
        title: 'Burst & relax',
        tab: `${repeat('@16 1:8:4 1:5:1 2:8:4 2:5:1 @4 3:7:3', 2)} ${repeat('@16 2:8:4 2:5:1 3:7:3 3:5:1 @4 4:7:3', 2)}`,
        startBpm: 80,
        goalBpm: 160,
      },
      { id: 'pro-fours', title: '3nps fours at speed', tab: fours(MINOR_3NPS), startBpm: 80, goalBpm: 150 },
    ],
  },
  {
    id: 'pro-sweep',
    level: 'pro',
    category: 'picking',
    title: 'Sweep picking',
    summary: 'One continuous pick motion across strings — each note fretted and released in time so they don’t ring together.',
    diagrams: ['sweep', 'muting'],
    leftHand: [
      '3-string shape (12th fret): ring 14 (G), middle 13 (B), index 12 (E), pinky hammers 17.',
      '5-string shape: pinky 12 (A), middle 10 (D), index 9 (G), middle 10 (B), index 8 (E), pinky 12 hammer.',
      'Lift each finger the moment the next note sounds — that is the “muting” half of sweeping.',
    ],
    rightHand: [
      'Push the pick through the strings in one motion like a slow strum, but each note separate.',
      'Let the pick rest against the next string for an instant (“rest stroke”).',
      'Palm follows across the lower strings for muting.',
    ],
    steps: [
      'Play the 3-string sweep very slowly — check no two notes ring together.',
      'Add the 5-string shape. Keep the rhythm perfectly even (triplets).',
    ],
    mistakes: ['Strumming — notes blurring into a chord.', 'The hammer/pull at the top rushing.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'pro-sweep3',
        title: '3-string A minor sweep',
        tab: `@12 ${repeat('3:14:3 2:13:2 1:12:1 1:17:4h 1:12:1p 2:13:2', 4)} @4 3:14:3~`,
        picking: 'economy',
        startBpm: 50,
        goalBpm: 120,
        drive: true,
      },
      {
        id: 'pro-sweep5',
        title: '5-string A minor sweep',
        tab: `@12 ${repeat('5:12:4 4:10:2 3:9:1 2:10:2 1:8:1 1:12:4h 1:8:1p 2:10:2 3:9:1 4:10:2', 3)} @4 5:12:4~`,
        picking: 'economy',
        startBpm: 45,
        goalBpm: 110,
        drive: true,
      },
    ],
  },
  {
    id: 'pro-tapping',
    level: 'pro',
    category: 'fretting',
    title: 'Two-hand tapping',
    summary: 'The picking hand taps notes on the fretboard, unlocking wide intervals at high speed.',
    diagrams: ['tapping'],
    leftHand: [
      'Index on fret 5, pinky on fret 8 (B string).',
      'Left hand mutes the other strings with the underside of the fingers.',
    ],
    rightHand: [
      'Tap with the middle finger (keep the pick held) or the index — tap firmly right behind the fret.',
      'Pull the tapping finger off sideways (down toward the floor) to sound the next note.',
      'Rest the side of the picking hand on the strings to mute them.',
    ],
    steps: [
      'Tap 12, pull off to 5, hammer 8 — repeat as even triplets.',
      'Move the tap and shape for each chord: Em, C, D.',
    ],
    mistakes: ['Weak pull-off from the tap (the 5th fret note disappears).', 'Open strings ringing — mute!'],
    droneRoot: 40,
    exercises: [
      {
        id: 'pro-tap-triplets',
        title: 'Tapping triplets: Em – C – D – Em',
        tab: `@12 ${repeat('2:12:Rt 2:5:1p 2:8:4h', 4)} ${repeat('2:13:Rt 2:5:1p 2:8:4h', 4)} ${repeat('2:15:Rt 2:7:1p 2:10:4h', 4)} ${repeat('2:12:Rt 2:5:1p 2:8:4h', 3)} @4 2:12:Rt`,
        picking: 'none',
        startBpm: 60,
        goalBpm: 140,
        drive: true,
      },
    ],
  },
  {
    id: 'pro-hybrid',
    level: 'pro',
    category: 'picking',
    title: 'Hybrid picking',
    summary: 'Pick + middle/ring fingers together — country snap, wide string skips and arpeggios with no pick travel.',
    diagrams: ['hybrid'],
    leftHand: ['A minor shape at the 5th fret: index barres G, B, E; ring frets D string 7.'],
    rightHand: [
      'Hold the pick normally; the middle finger plucks the higher string (shown as “F”).',
      'Pluck by curling the finger into the palm with a little snap.',
      'Keep the plucking finger close to the string between notes.',
    ],
    steps: ['Alternate pick-finger-pick-finger slowly.', 'Then speed up — it should feel like a roll.'],
    mistakes: ['Finger pulling too far away from the string.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'pro-hybrid-roll',
        title: 'Hybrid roll over Am',
        tab: `@16 ${repeat('4:7:3D 2:5:1F 3:5:1D 1:5:1F', 4)}`,
        startBpm: 60,
        goalBpm: 130,
      },
    ],
  },
  {
    id: 'pro-modes',
    level: 'pro',
    category: 'lead',
    title: 'Modal colour: Dorian & Mixolydian',
    summary: 'One changed note transforms the mood. Target the “colour note” on strong beats.',
    diagrams: ['oneFinger'],
    leftHand: ['Dorian colour note F# is on the B string fret 7 (ring finger).', 'Mixolydian colour note C# is on the G string fret 6 (middle).'],
    rightHand: ['Use pick dynamics to accent the colour notes.'],
    steps: ['Play each lick slowly, hear the colour note.', 'Over the drone, make your own lines that land on the colour note.'],
    mistakes: ['Running scales up and down instead of making phrases.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'pro-dorian',
        title: 'A Dorian lick (F# colour)',
        tab: '@8 3:7:3 2:5:1 2:7:3 2:8:4 @16 2:7:3 2:5:1 3:7:3 3:5:1 @4 4:7:3~ @8 2:7:3 @4. 2:7:3~',
        startBpm: 60,
        goalBpm: 110,
        drive: true,
      },
      {
        id: 'pro-mixo',
        title: 'A Mixolydian lick (C# colour)',
        tab: '@8 1:5:1 2:8:4 2:7:3 2:5:1 3:7:3 3:6:2 @4 4:7:3~',
        startBpm: 60,
        goalBpm: 120,
      },
    ],
  },
  {
    id: 'pro-neoclassical',
    level: 'pro',
    category: 'lead',
    title: 'Harmonic minor & pedal-point',
    summary: 'Neoclassical shred: alternate a fixed “pedal” note with a moving melody, using the harmonic minor’s raised 7th (G#).',
    diagrams: ['alternate'],
    leftHand: ['Index holds the pedal note (B string fret 9, then fret 12).', 'Use a slight stretch for frets 9–13 (fingers 1-2-3-4 on 9, 10, 12, 13).'],
    rightHand: ['Strict alternate picking on one string — perfect for building speed.'],
    steps: ['Learn the first bar, then the shifted second bar.', 'Push the tempo once it’s clean — this is a great speed builder.'],
    mistakes: ['Pedal note louder than the melody — keep it even.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'pro-pedal',
        title: 'B-string pedal point (A harmonic minor)',
        tab: '@16 2:13:4 2:9:1 2:12:3 2:9:1 2:10:2 2:9:1 2:12:3 2:9:1 | 2:15:4 2:12:1 2:13:2 2:12:1 2:15:4 2:12:1 2:13:2 2:12:1 | @4 2:10:1~',
        startBpm: 60,
        goalBpm: 140,
        drive: true,
      },
    ],
  },
  {
    id: 'pro-thrash',
    level: 'pro',
    category: 'riff',
    title: 'Thrash downpicking & syncopated chugs',
    summary: 'Endurance downpicking and tight syncopation — two pillars of modern metal rhythm.',
    diagrams: ['palmMute', 'alternate'],
    leftHand: ['F5: index fret 1 low E + ring fret 3 A string.'],
    rightHand: [
      'Downpicking: small motion from the wrist; elbow assists at high tempos. Stay relaxed.',
      'Syncopated riff uses “grid” picking: downs on the 16th-note grid’s even slots, ups on odd — the hand keeps moving through rests.',
    ],
    steps: ['Downpick the first riff for 1 minute nonstop.', 'Learn the syncopated riff — keep the hand moving in 16ths even through rests.'],
    mistakes: ['Downstrokes getting weaker as you tire — build endurance gradually.'],
    droneRoot: 40,
    exercises: [
      {
        id: 'pro-downpick',
        title: 'Downpicking endurance riff',
        tab: '@8 6:0:0m 6:0:0m 6:0:0m 6:1:1+5:3:3 6:0:0m 6:0:0m 6:3:1+5:5:3 6:1:1+5:3:3 | 6:0:0m 6:0:0m 6:0:0m 6:1:1+5:3:3 6:0:0m 6:5:1+5:7:3 6:3:1+5:5:3 6:1:1+5:3:3',
        picking: 'down',
        startBpm: 120,
        goalBpm: 200,
        drive: true,
      },
      {
        id: 'pro-sync',
        title: 'Syncopated 16th chug',
        tab: '@16 6:0:0m - 6:0:0m 6:0:0m - 6:0:0m - 6:0:0m 6:0:0m - - 6:0:0m @8 6:5:1+5:7:3 6:3:1+5:5:3',
        picking: 'grid',
        startBpm: 70,
        goalBpm: 140,
        drive: true,
      },
    ],
  },

  // ───────────────────────── ULTIMATE PRO ─────────────────────────
  {
    id: 'mst-sweep-tap',
    level: 'master',
    category: 'picking',
    title: 'Sweep + tap arpeggios',
    summary: 'Extend a 5-string sweep with a tapped note for a two-and-a-half-octave arpeggio.',
    diagrams: ['sweep', 'tapping'],
    leftHand: ['Same 5-string A minor sweep shape.', 'Mute strings after each note with the fingers lifting off.'],
    rightHand: ['After the upward sweep, tap fret 17 with the middle finger, then pull off.', 'Then sweep back up with upstrokes.'],
    steps: ['Practise the turn-around (tap–pull–pull) alone first.', 'Combine with the sweep, keep 16th-triplet timing.'],
    mistakes: ['Pausing before the tap — it must be in rhythm.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'mst-sweeptap',
        title: 'A minor sweep with tap',
        tab: `@24 ${repeat('5:12:4 4:10:2 3:9:1 2:10:2 1:8:1 1:12:4h 1:17:Rt 1:12:4p 1:8:1p 2:10:2 3:9:1 4:10:2', 3)} @4 5:12:4~`,
        picking: 'economy',
        startBpm: 40,
        goalBpm: 100,
        drive: true,
      },
    ],
  },
  {
    id: 'mst-skipping',
    level: 'master',
    category: 'picking',
    title: 'String-skipping sequences',
    summary: 'Wide intervals by skipping strings — breaks up scalar sound and demands precise pick accuracy.',
    diagrams: ['alternate', 'muting'],
    leftHand: ['Box 1 fingering; keep unused fingers hovering.'],
    rightHand: ['Arc the pick slightly over the skipped string.', 'Mute the skipped string with the palm and fretting fingers.'],
    steps: ['Play slowly with strict alternate picking.', 'Listen for the skipped string — it must stay silent.'],
    mistakes: ['Hitting the skipped string.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'mst-skip-seq',
        title: 'Pentatonic skip sequence',
        tab: '@16 6:5:1 6:8:4 4:5:1 4:7:3 5:5:1 5:7:3 3:5:1 3:7:3 4:5:1 4:7:3 2:5:1 2:8:4 3:5:1 3:7:3 1:5:1 1:8:4 @4 1:5:1~',
        startBpm: 60,
        goalBpm: 140,
        drive: true,
      },
    ],
  },
  {
    id: 'mst-wide-legato',
    level: 'master',
    category: 'fretting',
    title: 'Wide-stretch 4-notes-per-string legato',
    summary: 'Fusion-style wide stretches for long, flowing legato lines. Warm up first!',
    diagrams: ['legato', 'thumb'],
    leftHand: [
      'Thumb low behind the neck (classical position) to open the hand.',
      'Fingers 1-2-3-4 on frets 12-13-15-17 — a 6-fret span. Stretch from the knuckles, not by twisting the wrist.',
      '“Hammer-on from nowhere”: the first note on a new string is hammered with no pick.',
    ],
    rightHand: ['Pick only the very first note. Mute all other strings with the palm.'],
    steps: ['Start very slowly. Stop if you feel strain.', 'Build to even 16ths.'],
    mistakes: ['Forcing the stretch with tension — injury risk. Build gradually.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'mst-4nps',
        title: '4nps descending legato',
        tab: '@16 1:17:4 1:15:3p 1:13:2p 1:12:1p 2:17:4h 2:15:3p 2:13:2p 2:12:1p 3:17:4h 3:16:3p 3:14:2p 3:12:1p @4 4:14:3~',
        startBpm: 50,
        goalBpm: 120,
        drive: true,
      },
    ],
  },
  {
    id: 'mst-expressive',
    level: 'master',
    category: 'lead',
    title: 'Pinch harmonics & compound bends',
    summary: 'Squealing harmonics and 1½-step bends — expressive tools that set pro players apart.',
    diagrams: ['pickGrip', 'bend'],
    leftHand: ['1½-step bend: ring finger with full support; aim for the pitch 3 frets up.'],
    rightHand: [
      'Pinch harmonic: choke up on the pick so the thumb edge grazes the string right after the pick hits it.',
      'Sweet spots are around the neck pickup and bridge pickup — move slightly to find the squeal.',
      'Use the bridge pickup with gain.',
    ],
    steps: ['Find the harmonic sweet spot on the G string 7th fret.', 'Combine with bends and vibrato.'],
    mistakes: ['Thumb touching too long (mutes the note).'],
    droneRoot: 45,
    exercises: [
      {
        id: 'mst-pinch',
        title: 'Pinch harmonic bends',
        tab: '@2 3:7:3*~ 3:7:3*b2~ | 4:7:3*~ @4 2:8:3b3 2:8:3b3r',
        startBpm: 60,
        goalBpm: 80,
        drive: true,
      },
    ],
  },
  {
    id: 'mst-outside',
    level: 'master',
    category: 'lead',
    title: 'Chromatic & outside lines',
    summary: 'Use passing tones and side-stepping a half step out of key, then resolve back — tension and release.',
    diagrams: ['oneFinger'],
    leftHand: ['Chromatic run: ring–middle–index on each string (frets 7-6-5).', 'Side-step: shift the whole shape up one fret, then back.'],
    rightHand: ['Strict alternate picking.'],
    steps: ['Learn the chromatic run.', 'Learn the side-step lick — always resolve the outside part back home.'],
    mistakes: ['Ending on the outside notes.'],
    droneRoot: 45,
    exercises: [
      {
        id: 'mst-chromatic',
        title: 'Chromatic passing run',
        tab: '@16 3:7:3 3:6:2 3:5:1 4:7:3 4:6:2 4:5:1 5:7:3 5:6:2 5:5:1 6:8:4 6:7:3 6:5:1 @4 6:5:1~',
        startBpm: 60,
        goalBpm: 130,
        drive: true,
      },
      {
        id: 'mst-sidestep',
        title: 'Side-step out and back',
        tab: '@16 2:8:4 2:5:1 3:7:3 3:5:1 2:9:4 2:6:1 3:8:3 3:6:1 2:8:4 2:5:1 3:7:3 @4. 4:7:3~',
        startBpm: 60,
        goalBpm: 130,
        drive: true,
      },
    ],
  },
  {
    id: 'mst-odd',
    level: 'master',
    category: 'riff',
    title: 'Odd-meter riffs (7/8)',
    summary: 'Progressive metal riffing: 7/8 grouped 4+4+3+3 sixteenths… lock in with grid picking.',
    diagrams: ['palmMute'],
    leftHand: ['Power chords with index + ring.'],
    rightHand: ['Grid picking — keep the 16th motion going through rests.', 'Count “1-e-&-a 2-e-&-a 3-e-& 4-e-&”.'],
    steps: ['Count out loud first.', 'Loop the riff — the click accent marks each bar start.'],
    mistakes: ['Turning 7/8 into 4/4 by adding a beat.'],
    droneRoot: 40,
    exercises: [
      {
        id: 'mst-78',
        title: '7/8 chug riff',
        tab: '@16 6:0:0m 6:0:0m 6:0:0m 6:0:0m 6:3:1+5:5:3 - 6:0:0m 6:0:0m 6:0:0m 6:0:0m 6:5:1+5:7:3 - 6:0:0m 6:0:0m',
        picking: 'grid',
        startBpm: 70,
        goalBpm: 140,
        drive: true,
      },
    ],
  },
  {
    id: 'mst-speed',
    level: 'master',
    category: 'picking',
    title: 'Speed mastery: sextuplet scales',
    summary: 'Six notes per beat across the full 3nps scale — the benchmark for elite alternate picking.',
    diagrams: ['alternate', 'pickAngle'],
    leftHand: ['Minimal finger lift; fingers move as a unit with the pick.'],
    rightHand: ['Pick slant and wrist/forearm motion; stay relaxed.', 'Practise just above your clean limit for short bursts, then below for long runs.'],
    steps: ['Start at a clean tempo, 5 BPM up per success, 10 back on failure.'],
    mistakes: ['Practising sloppy at speed — it trains sloppiness.'],
    droneRoot: 45,
    exercises: [
      { id: 'mst-sextuplets', title: '3nps A minor in sextuplets', tab: upDown(MINOR_3NPS, 24), startBpm: 60, goalBpm: 130 },
      { id: 'mst-sixes-fast', title: 'Pentatonic sixes at speed', tab: sixes(PENT_BOX1), startBpm: 90, goalBpm: 150, drive: true },
    ],
  },
]

const eventCache = new Map<string, TabEvent[]>()
export function eventsFor(ex: Exercise): TabEvent[] {
  let ev = eventCache.get(ex.id)
  if (!ev) {
    ev = parseTab(ex.tab, ex.picking)
    eventCache.set(ex.id, ev)
  }
  return ev
}

export const ALL_EXERCISES: { ex: Exercise; lesson: Lesson }[] = LESSONS.flatMap((lesson) =>
  lesson.exercises.map((ex) => ({ ex, lesson })),
)

export function findExercise(id: string) {
  return ALL_EXERCISES.find((e) => e.ex.id === id)
}

export function levelIndex(id: LevelId): number {
  return LEVELS.findIndex((l) => l.id === id)
}
