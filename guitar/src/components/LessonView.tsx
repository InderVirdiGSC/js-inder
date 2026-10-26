import { CATEGORY_LABEL, LEVELS, eventsFor, type Exercise, type Lesson } from '../data/curriculum'
import { bestBpm, type Store } from '../store'
import { Diagram } from './diagrams'
import { DroneButton } from './DroneButton'
import { TabPlayer } from './TabPlayer'

export function ExerciseCard({ ex, store }: { ex: Exercise; store: Store }) {
  const best = bestBpm(store.state, ex.id)
  return (
    <div className="card exercise">
      <div className="card-head">
        <h3>{ex.title}</h3>
        <span className="muted small">
          {ex.startBpm}→{ex.goalBpm} BPM
        </span>
      </div>
      {ex.tip && <p className="tip">{ex.tip}</p>}
      <TabPlayer
        key={ex.id}
        events={eventsFor(ex)}
        startBpm={ex.startBpm}
        goalBpm={ex.goalBpm}
        drive={ex.drive}
        settings={store.state.settings}
        onSettings={store.updateSettings}
        best={best}
        onLog={(bpm) => store.logBpm(ex.id, bpm)}
      />
    </div>
  )
}

export function LessonView({ lesson, store, onBack }: { lesson: Lesson; store: Store; onBack: () => void }) {
  const done = store.state.completed.includes(lesson.id)
  const level = LEVELS.find((l) => l.id === lesson.level)!
  return (
    <div className="view lesson">
      <button className="back" onClick={onBack}>
        ‹ Lessons
      </button>
      <div className="badges">
        <span className={`badge lvl-${lesson.level}`}>{level.name}</span>
        <span className="badge">{CATEGORY_LABEL[lesson.category]}</span>
      </div>
      <h2 className="lesson-title">{lesson.title}</h2>
      <p className="muted">{lesson.summary}</p>

      <div className="diagram-strip">
        {lesson.diagrams.map((d) => (
          <Diagram key={d} id={d} />
        ))}
      </div>

      <div className="hands">
        <div className="card hand">
          <h3>
            <span className="dot" style={{ background: '#4f8cff' }} /> Fretting hand
          </h3>
          <ul>
            {lesson.leftHand.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card hand">
          <h3>
            <span className="dot" style={{ background: '#ffb020' }} /> Picking hand
          </h3>
          <ul>
            {lesson.rightHand.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>How to practise</h3>
        <ol>
          {lesson.steps.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        {lesson.droneRoot !== undefined && (
          <div className="row">
            <DroneButton root={lesson.droneRoot} drive={store.state.settings.drive} label="Jam over a drone" />
          </div>
        )}
      </div>

      <h3 className="section-title">Exercises</h3>
      {lesson.exercises.map((ex) => (
        <ExerciseCard key={ex.id} ex={ex} store={store} />
      ))}

      <div className="card warn-card">
        <h3>Common mistakes</h3>
        <ul>
          {lesson.mistakes.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <button className={`primary ${done ? 'primary-done' : ''}`} onClick={() => store.toggleCompleted(lesson.id)}>
        {done ? '✓ Lesson mastered' : 'Mark lesson as mastered'}
      </button>
    </div>
  )
}
