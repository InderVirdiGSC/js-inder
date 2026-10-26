import { useCallback, useEffect, useState } from 'react'
import type { Unit } from './types'

export interface AiSettings {
  apiKey: string
  model: string
}

export const DEFAULT_MODEL = 'gpt-5.4-mini'
const SETTINGS_KEY = 'plan-tracker-ai'

function loadSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { apiKey: '', model: DEFAULT_MODEL, ...JSON.parse(raw) }
  } catch {
    /* use defaults */
  }
  return { apiKey: '', model: DEFAULT_MODEL }
}

/** Kept apart from the main app state so the key never ends up in exported backups. */
export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(loadSettings)
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])
  const save = useCallback((s: AiSettings) => setSettings({ apiKey: s.apiKey.trim(), model: s.model.trim() || DEFAULT_MODEL }), [])
  return [settings, save] as const
}

export interface FoodSuggestion {
  name: string
  brand: string | null
  unit: Unit
  basisQty: number
  protein: number
  kcal: number
  fromLabel: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  image?: string
  foods?: FoodSuggestion[]
  error?: boolean
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'foods'],
  properties: {
    reply: { type: 'string' },
    foods: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'brand', 'unit', 'basisQty', 'protein', 'kcal', 'fromLabel'],
        properties: {
          name: { type: 'string' },
          brand: { type: ['string', 'null'] },
          unit: { type: 'string', enum: ['g', 'ml', 'piece', 'scoop', 'serving'] },
          basisQty: { type: 'number' },
          protein: { type: 'number' },
          kcal: { type: 'number' },
          fromLabel: { type: 'boolean' },
        },
      },
    },
  },
}

const SYSTEM_PROMPT = `You are the nutrition assistant inside a personal diet-tracking app. The user lives in Canada.

Answer briefly and plainly (a few short sentences or a short list). Focus on protein and calories.

Whenever the answer involves specific foods, also return them in "foods" so the user can add them to their item list:
- name: short food name; brand: brand if known, else null.
- unit: "g" or "ml" for weighed foods, "piece" for countable items (roti, egg, tortilla), "scoop" for powders, "serving" otherwise.
- basisQty: the amount the values refer to (e.g. 100 for per 100 g, 1 for one piece).
- protein (grams) and kcal for that basisQty.
- fromLabel: true only when read directly from a nutrition label photo; false for estimates.
If the user sends a nutrition label photo, read the serving size, calories and protein exactly as printed.
Return an empty "foods" array for general questions that are not about specific foods.`

function contextBlock(context: string): string {
  return `Current app data (use it when the question is about the user's plan or today's progress):\n${context}`
}

type ApiContent = string | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[]

export async function askNutrition(
  history: ChatMessage[],
  settings: AiSettings,
  context: string,
): Promise<{ reply: string; foods: FoodSuggestion[] }> {
  const messages: { role: string; content: ApiContent }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextBlock(context) },
  ]
  for (const m of history) {
    if (m.error) continue
    if (m.role === 'user') {
      messages.push({
        role: 'user',
        content: m.image
          ? [
              { type: 'text', text: m.text || 'Read this nutrition label.' },
              { type: 'image_url', image_url: { url: m.image } },
            ]
          : m.text,
      })
    } else {
      messages.push({ role: 'assistant', content: JSON.stringify({ reply: m.text, foods: m.foods ?? [] }) })
    }
  }

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_completion_tokens: 2000,
        response_format: { type: 'json_schema', json_schema: { name: 'nutrition_answer', strict: true, schema: SCHEMA } },
      }),
    })
  } catch {
    throw new Error('Could not reach OpenAI. Check your internet connection.')
  }

  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json())?.error?.message ?? ''
    } catch {
      /* no body */
    }
    if (res.status === 401) throw new Error('Your OpenAI API key was rejected. Check it in the Goals tab.')
    if (res.status === 429) throw new Error('OpenAI says you are out of credit or sending too fast. Check your billing at platform.openai.com.')
    if (res.status === 404 || (res.status === 400 && /model/i.test(detail))) throw new Error(`Model problem: ${detail || 'model not found'}. Change the model in the Goals tab.`)
    throw new Error(detail || `OpenAI error ${res.status}`)
  }

  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  const refusal: string | undefined = data?.choices?.[0]?.message?.refusal
  if (!content) throw new Error(refusal || 'Empty answer from OpenAI. Try again.')
  const parsed = JSON.parse(content) as { reply: string; foods: FoodSuggestion[] }
  return {
    reply: parsed.reply,
    foods: (parsed.foods ?? []).filter((f) => f.basisQty > 0 && f.protein >= 0 && f.kcal >= 0),
  }
}

export async function resizeImage(file: File, maxSide = 1280): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not read that image.'))
      el.src = url
    })
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}
