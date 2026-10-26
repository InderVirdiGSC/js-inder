import { LESSONS, levelIndex, type Category, type Exercise, type Lesson } from './data/curriculum'
import { NOTE_NAMES } from './music/theory'
import type { AppState } from './store'

export type BlockKind = 'warmup' | Category | 'improv'

export interface Block {
  kind: BlockKind
  title: string
  minutes: number
  lesson?: Lesson
  exercise?: Exercise
  droneRoot?: number
  prompt?: string
}

export const BLOCK_LABEL: Record<BlockKind, string> = {
  warmup: 'Warm-up',
  picking: 'Picking technique',
  fretting: 'Fretting technique',
  lead: 'Lead lick',
  riff: 'Riff',
  improv: 'Improvise',
}

const WEIGHTS: [BlockKind, number][] = [
  ['warmup', 0.15],
  ['picking', 0.2],
  ['fretting', 0.15],
  ['lead', 0.2],
  ['riff', 0.15],
  ['improv', 0.15],
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(items: T[], seed: string): T {
  return items[hash(seed) % items.length]
}

function lessonsFor(state: AppState, category: Category): Lesson[] {
  const lvl = levelIndex(state.level)
  const atLevel = LESSONS.filter((l) => l.category === category && levelIndex(l.level) === lvl)
  const pool = atLevel.length ? atLevel : LESSONS.filter((l) => l.category === category && levelIndex(l.level) <= lvl)
  const unfinished = pool.filter((l) => !state.completed.includes(l.id))
  return unfinished.length ? unfinished : pool
}

export function noteName(midi: number): string {
  return NOTE_NAMES[midi % 12]
}

export function buildSession(state: AppState, day: string, totalMinutes: number): Block[] {
  const kinds = WEIGHTS.filter(([k]) => !(totalMinutes <= 15 && k === 'fretting'))
  const weightSum = kinds.reduce((a, [, w]) => a + w, 0)
  const blocks: Block[] = []
  let leadLesson: Lesson | undefined

  for (const [kind, w] of kinds) {
    const minutes = Math.max(1, Math.round((totalMinutes * w) / weightSum))
    const seed = `${day}|${state.level}|${kind}`
    if (kind === 'warmup') {
      const warmups = LESSONS.filter((l) => l.level === 'intermediate' && (l.category === 'fretting' || l.id === 'int-pick-grip'))
        .flatMap((lesson) => lesson.exercises.map((exercise) => ({ lesson, exercise })))
      const choice = pick(warmups, seed)
      blocks.push({ kind, title: choice.exercise.title, minutes, ...choice })
    } else if (kind === 'improv') {
      const lesson = leadLesson
      const root = lesson?.droneRoot ?? 45
      blocks.push({
        kind,
        title: `Improvise over ${/^[AEF]/.test(noteName(root)) ? 'an' : 'a'} ${noteName(root)} drone`,
        minutes,
        lesson,
        droneRoot: root,
        prompt: lesson
          ? `Use the shapes from “${lesson.title}”. Play today’s lick at least three times, changing its rhythm or last note each time. Leave space between phrases.`
          : 'Play short phrases in A minor pentatonic, leave space, end phrases on the root.',
      })
    } else {
      const lesson = pick(lessonsFor(state, kind), seed)
      const exercise = pick(lesson.exercises, `${seed}|ex`)
      if (kind === 'lead') leadLesson = lesson
      blocks.push({ kind, title: exercise.title, minutes, lesson, exercise })
    }
  }
  return blocks
}
