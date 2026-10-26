import type { Finger } from '../music/notation'

export const FINGER_COLOR: Record<string, string> = {
  '0': '#9aa4b2',
  '1': '#4f8cff',
  '2': '#34c759',
  '3': '#ffb020',
  '4': '#ff5ab4',
  T: '#a78bfa',
  R: '#ff5a5f',
}

export const FINGER_NAME: Record<string, string> = {
  '0': 'Open string',
  '1': 'Index',
  '2': 'Middle',
  '3': 'Ring',
  '4': 'Pinky',
  T: 'Thumb',
  R: 'Picking-hand tap',
}

export const STRING_NAME: Record<number, string> = { 1: 'high E', 2: 'B', 3: 'G', 4: 'D', 5: 'A', 6: 'low E' }

export function fingerColor(g: Finger | string): string {
  return FINGER_COLOR[String(g)] ?? '#9aa4b2'
}
