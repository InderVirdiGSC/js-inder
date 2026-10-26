import { useEffect, useState } from 'react'
import { LESSONS, LEVELS } from './data/curriculum'
import { LearnView } from './components/LearnView'
import { LessonView } from './components/LessonView'
import { PracticeView } from './components/PracticeView'
import { ProgressView } from './components/ProgressView'
import { ToolsView } from './components/ToolsView'
import { useAppState } from './store'
import { usePracticeSession } from './usePracticeSession'

type Tab = 'practice' | 'learn' | 'tools' | 'progress'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'practice', label: 'Practice', icon: '◉' },
  { id: 'learn', label: 'Learn', icon: '♪' },
  { id: 'tools', label: 'Tools', icon: '◷' },
  { id: 'progress', label: 'Progress', icon: '▲' },
]

export default function App() {
  const store = useAppState()
  const practice = usePracticeSession(store)
  const [tab, setTab] = useState<Tab>('practice')
  const [lessonId, setLessonId] = useState<string | null>(null)
  const lesson = lessonId ? LESSONS.find((l) => l.id === lessonId) : undefined
  const level = LEVELS.find((l) => l.id === store.state.level)!

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab, lessonId])

  const openLesson = (id: string) => {
    setLessonId(id)
    setTab('learn')
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          Guitar<span className="accent">Coach</span>
        </h1>
        <span className={`badge lvl-${level.id}`}>{level.name}</span>
      </header>

      {tab === 'practice' && <PracticeView store={store} practice={practice} onOpenLesson={openLesson} />}
      {tab === 'learn' &&
        (lesson ? <LessonView lesson={lesson} store={store} onBack={() => setLessonId(null)} /> : <LearnView store={store} onOpen={setLessonId} />)}
      {tab === 'tools' && <ToolsView store={store} />}
      {tab === 'progress' && <ProgressView store={store} />}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => {
              if (t.id === 'learn' && tab === 'learn') setLessonId(null)
              setTab(t.id)
            }}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
            {t.id === 'practice' && practice.session && !practice.session.finished && <i className="live-dot" />}
          </button>
        ))}
      </nav>
    </div>
  )
}
