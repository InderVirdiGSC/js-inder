import { useEffect, useRef, useState } from 'react'
import { resizeImage, type ChatMessage, type FoodSuggestion } from '../ai'
import { fmtQty } from '../nutrition'

interface Props {
  messages: ChatMessage[]
  busy: boolean
  hasKey: boolean
  onSend: (text: string, image?: string) => void
  onAddFood: (food: FoodSuggestion) => void
  onClear: () => void
  onOpenSettings: () => void
}

const EXAMPLES = [
  'Protein and calories in 100 g chickpeas?',
  'How much paneer do I need to finish my protein today?',
  '1 large boiled egg',
  'Compare tofu vs paneer per 100 g',
]

function FoodCard({ food, onAdd }: { food: FoodSuggestion; onAdd: () => void }) {
  return (
    <div className="food-card">
      <div>
        <div className="food-name">
          {food.name}
          {!food.fromLabel && <span className="badge badge-warn">estimate</span>}
        </div>
        <div className="muted small">
          {food.brand ? `${food.brand} · ` : ''}
          {food.protein} g protein · {food.kcal} cal per {fmtQty(food.basisQty, food.unit)}
        </div>
      </div>
      <button className="btn btn-ghost btn-small" onClick={onAdd}>
        Add to items
      </button>
    </div>
  )
}

export function AskView({ messages, busy, hasKey, onSend, onAddFood, onClear, onOpenSettings }: Props) {
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | undefined>()
  const [imageError, setImageError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, busy])

  if (!hasKey) {
    return (
      <div className="view">
        <div className="card">
          <p>
            <b>Ask</b> looks up protein and calories for any food, or reads a nutrition label photo, using your own
            OpenAI API key.
          </p>
          <ol>
            <li>
              Go to <b>platform.openai.com</b>, sign in, add a few dollars of credit under <b>Billing</b>.
            </li>
            <li>
              Open <b>API keys</b>, create a key and copy it.
            </li>
            <li>Paste it in the Goals tab under AI search.</li>
          </ol>
          <p className="muted small">A ChatGPT subscription does not include API credit; it is billed separately.</p>
        </div>
        <button className="btn btn-primary btn-block" onClick={onOpenSettings}>
          Add API key
        </button>
      </div>
    )
  }

  const canSend = !busy && (text.trim() !== '' || image)

  const send = (override?: string) => {
    const t = (override ?? text).trim()
    if (busy || (!t && !image)) return
    onSend(t, image)
    setText('')
    setImage(undefined)
  }

  return (
    <div className="view ask">
      {messages.length === 0 ? (
        <div className="ask-empty">
          <p className="muted">Ask about any food, or send a photo of a nutrition label.</p>
          <div className="examples">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="chip example" onClick={() => send(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`msg msg-${m.role} ${m.error ? 'msg-error' : ''}`}>
              {m.image && <img src={m.image} alt="Uploaded label" />}
              {m.text && <p>{m.text}</p>}
              {m.foods?.map((f, i) => (
                <FoodCard key={i} food={f} onAdd={() => onAddFood(f)} />
              ))}
            </div>
          ))}
          {busy && <div className="msg msg-assistant typing">Thinking…</div>}
          <button className="clear-chat" onClick={onClear}>
            Clear chat
          </button>
        </div>
      )}
      <div ref={endRef} />

      <div className="composer">
        {image && (
          <div className="composer-image">
            <img src={image} alt="Selected" />
            <button onClick={() => setImage(undefined)} aria-label="Remove photo">
              ×
            </button>
          </div>
        )}
        {imageError && <p className="bad small">{imageError}</p>}
        <div className="composer-row">
          <button className="composer-photo" onClick={() => fileRef.current?.click()} aria-label="Add label photo">
            Photo
          </button>
          <input
            className="composer-input"
            placeholder={image ? 'Optional question about the photo' : 'e.g. 100 g tofu'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
            enterKeyHint="send"
          />
          <button className="btn btn-primary composer-send" disabled={!canSend} onClick={() => send()}>
            Ask
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              setImageError('')
              setImage(await resizeImage(f))
            } catch (err) {
              setImageError((err as Error).message)
            }
          }}
        />
      </div>
    </div>
  )
}
