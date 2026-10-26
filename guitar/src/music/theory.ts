export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export const INTERVAL_NAMES = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']

export interface Scale {
  id: string
  name: string
  steps: number[]
  use: string
}

export const SCALES: Scale[] = [
  { id: 'minpent', name: 'Minor pentatonic', steps: [0, 3, 5, 7, 10], use: 'The rock/blues lead workhorse.' },
  { id: 'blues', name: 'Blues scale', steps: [0, 3, 5, 6, 7, 10], use: 'Minor pentatonic + the b5 "blue note".' },
  { id: 'majpent', name: 'Major pentatonic', steps: [0, 2, 4, 7, 9], use: 'Sweet, country/southern-rock sound.' },
  { id: 'minor', name: 'Natural minor (Aeolian)', steps: [0, 2, 3, 5, 7, 8, 10], use: 'Dark melodic rock & metal.' },
  { id: 'major', name: 'Major (Ionian)', steps: [0, 2, 4, 5, 7, 9, 11], use: 'Bright, resolved melodies.' },
  { id: 'dorian', name: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10], use: 'Minor with a bright 6th — funk, Santana, fusion.' },
  { id: 'mixo', name: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10], use: 'Major with b7 — classic rock over dominant chords.' },
  { id: 'phrygian', name: 'Phrygian', steps: [0, 1, 3, 5, 7, 8, 10], use: 'Dark b2 — metal riffs & Spanish flavour.' },
  { id: 'harmmin', name: 'Harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11], use: 'Neoclassical shred, raised 7th leading tone.' },
  { id: 'phrydom', name: 'Phrygian dominant', steps: [0, 1, 4, 5, 7, 8, 10], use: '5th mode of harmonic minor — exotic metal.' },
]

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12
}
