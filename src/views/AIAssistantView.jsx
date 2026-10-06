import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Check,
  CircleQuestionMark,
  Copy,
  CreditCard,
  Layers,
  ListTree,
  Loader2,
  MessageSquareQuote,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  SquareTerminal,
  Trash2,
  User,
  WifiOff,
  X,
} from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import * as store from '../services/store'
import { AI_TASKS, classifyAiError, requestAi } from '../services/ai'

/* ------------------------------------------------------------------ tools */

const TOOLS = [
  {
    id: AI_TASKS.ask,
    label: 'Ask',
    icon: Sparkles,
    placeholder: {
      student: 'Ask anything about your studies',
      instructor: 'Ask anything about teaching your courses',
    },
  },
  {
    id: AI_TASKS.outline,
    label: 'Outline',
    icon: ListTree,
    placeholder: { student: 'Lecture topic to outline', instructor: 'Lecture topic to outline' },
  },
  {
    id: AI_TASKS.feedback,
    label: 'Draft feedback',
    icon: MessageSquareQuote,
    placeholder: {
      student: 'Paste your notes for feedback',
      instructor: 'Paste your draft for feedback',
    },
  },
  {
    id: AI_TASKS.quiz,
    label: 'Quiz',
    icon: CircleQuestionMark,
    placeholder: {
      student: 'Topic to be quizzed on',
      instructor: 'Topic or lecture to build a quiz from',
    },
  },
  {
    id: AI_TASKS.flashcards,
    label: 'Flashcards',
    icon: Layers,
    placeholder: {
      student: 'Topic to turn into flashcards',
      instructor: 'Topic to turn into flashcards',
    },
  },
]

/* ------------------------------------------------------- chat persistence */

const CHAT_KEY_PREFIX = 'vox_ai_chats_'
const MAX_CHATS = 40
const TITLE_LENGTH = 44

const storageKey = (uid) => `${CHAT_KEY_PREFIX}${uid ?? 'anon'}`

const loadChats = (uid) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(uid)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((chat) => chat && Array.isArray(chat.messages)) : []
  } catch {
    return []
  }
}

const saveChats = (uid, chats) => {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(chats.slice(0, MAX_CHATS)))
  } catch {
    /* storage full or unavailable — chats simply won't persist */
  }
}

let idCounter = 0
const nextId = () => {
  idCounter += 1
  return `${Date.now().toString(36)}${idCounter.toString(36)}`
}

/** Pure: appends a message, creating the chat on first use. */
const withMessage = (chats, chatId, message, title, now) => {
  const index = chats.findIndex((chat) => chat.id === chatId)
  if (index === -1) {
    const heading = (title ?? 'New chat').trim()
    return [
      {
        id: chatId,
        title: heading.length > TITLE_LENGTH ? `${heading.slice(0, TITLE_LENGTH)}…` : heading,
        messages: [message],
        updatedAt: now,
      },
      ...chats,
    ].slice(0, MAX_CHATS)
  }
  const next = [...chats]
  next[index] = {
    ...next[index],
    messages: [...next[index].messages, message],
    updatedAt: now,
  }
  return next
}

/* ---------------------------------------------------------- error surface */

const ERROR_PRESENTATION = {
  offline: {
    icon: WifiOff,
    title: 'Endpoint offline',
    body: 'The AI service is not reachable. The serverless function only runs under a host dev server or a real deployment.',
    hint: 'vercel dev',
  },
  unconfigured: {
    icon: SquareTerminal,
    title: 'AI not configured',
    body: 'The AI function is running but has no provider key yet. Add one to your environment to switch the assistant on.',
    hint: 'OPENCODE_API_KEY',
  },
  billing: {
    icon: CreditCard,
    title: 'AI billing required',
    body: 'The AI provider rejected the request because the account has no payment method or has run out of credits.',
    hint: 'check your provider billing',
  },
  unauthorized: {
    icon: ShieldAlert,
    title: 'AI actions require authorization',
    body: 'Your account is not allowed to use this AI action yet. An administrator needs to grant access.',
    hint: 'contact an administrator',
  },
  error: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    body: 'The AI request did not complete. Try again, and if it keeps failing, check the function logs.',
    hint: 'try again',
  },
}

const ErrorPanel = ({ message, onRetry, onDismiss }) => {
  const state = classifyAiError(message)
  const { icon: Icon, title, body, hint } = ERROR_PRESENTATION[state]
  return (
    <div className="relative flex flex-col items-center justify-center text-center p-8 gap-3 rounded-3xl border border-amber-500/30 bg-amber-500/5">
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
        <Icon className="w-7 h-7 text-amber-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed">{body}</p>
      {message && state === 'error' && (
        <p className="text-xs text-slate-500 dark:text-slate-500 max-w-md">{message}</p>
      )}
      <code className="text-[11px] font-mono px-2 py-1 rounded bg-slate-900/60 border border-white/10 text-slate-300">
        {hint}
      </code>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ view */

const AIAssistantView = () => {
  const { currentUser, courses, isDemo } = useAppContext()

  const role = currentUser?.role ?? 'student'
  const isInstructor = role === 'instructor'
  const uid = currentUser?.uid

  const myCourses = useMemo(
    () =>
      (courses ?? []).filter((course) =>
        isInstructor
          ? course.instructorId === uid
          : Boolean(currentUser?.joinedCourses?.includes(course.id)),
      ),
    [courses, isInstructor, uid, currentUser?.joinedCourses],
  )

  // Firestore `in` queries accept at most 10 values.
  const courseIds = useMemo(() => myCourses.map((course) => course.id).slice(0, 10), [myCourses])
  const courseKey = courseIds.join(',')

  const [podcasts, setPodcasts] = useState([])
  const [materials, setMaterials] = useState([])
  const [assignments, setAssignments] = useState([])

  useEffect(() => {
    if (!courseKey) return undefined
    const ids = courseKey.split(',')
    const read = (snap) => snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    const noop = () => {}
    const unsubscribers = [
      store.onSnapshot(
        store.query(store.collection(store.db, 'podcasts'), store.where('courseId', 'in', ids)),
        (snap) => setPodcasts(read(snap)),
        noop,
      ),
      store.onSnapshot(
        store.query(store.collection(store.db, 'materials'), store.where('courseId', 'in', ids)),
        (snap) => setMaterials(read(snap)),
        noop,
      ),
      store.onSnapshot(
        store.query(store.collection(store.db, 'assignments'), store.where('courseId', 'in', ids)),
        (snap) => setAssignments(read(snap)),
        noop,
      ),
    ]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [courseKey])

  /** What the assistant is allowed to know about the user's courses. */
  const aiContext = useMemo(
    () => ({
      name: currentUser?.fullName ?? '',
      role,
      institution: currentUser?.institution ?? '',
      courses: myCourses.map((course) => course.title).filter(Boolean),
      library: myCourses.map((course) => ({
        id: course.id,
        title: course.title,
        podcasts: podcasts
          .filter((item) => item.courseId === course.id)
          .map((item) => ({ id: item.id, title: item.title, description: item.description ?? '' })),
        materials: materials
          .filter((item) => item.courseId === course.id)
          .map((item) => ({ id: item.id, title: item.title })),
        assignments: assignments
          .filter((item) => item.courseId === course.id)
          .map((item) => ({ id: item.id, title: item.title, dueDate: item.dueDate ?? '' })),
      })),
    }),
    [currentUser?.fullName, currentUser?.institution, role, myCourses, podcasts, materials, assignments],
  )

  /* ------------------------------------------------------------ chat state */

  const [chats, setChats] = useState(() => loadChats(uid))
  const [activeId, setActiveId] = useState(null)
  const [draft, setDraft] = useState('')
  const [task, setTask] = useState(AI_TASKS.ask)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  useEffect(() => {
    saveChats(uid, chats)
  }, [uid, chats])

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeId) ?? null,
    [chats, activeId],
  )
  const messages = useMemo(() => activeChat?.messages ?? [], [activeChat])

  const scrollRef = useRef(null)
  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length, pending])

  const activeTool = TOOLS.find((tool) => tool.id === task) ?? TOOLS[0]
  const placeholder = activeTool.placeholder[isInstructor ? 'instructor' : 'student']

  /* --------------------------------------------------------------- actions */

  const startNewChat = useCallback(() => {
    setActiveId(null)
    setDraft('')
    setError('')
  }, [])

  const removeChat = useCallback((id) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id))
    setActiveId((current) => (current === id ? null : current))
  }, [])

  const submit = useCallback(
    async (retryText) => {
      const text = (retryText ?? draft).trim()
      if (!text || pending) return

      const now = Date.now()
      const chatId = activeId ?? nextId()
      const userMessage = { id: nextId(), role: 'user', text, task, at: now }
      const assistantId = nextId()

      setError('')
      setPending(true)
      setChats((prev) => withMessage(prev, chatId, userMessage, text, now))
      setActiveId(chatId)
      setDraft('')

      try {
        const result = await requestAi({ task, prompt: text, context: aiContext })
        setChats((prev) =>
          withMessage(
            prev,
            chatId,
            { id: assistantId, role: 'assistant', text: result.text, task, at: Date.now() },
            text,
            Date.now(),
          ),
        )
      } catch (requestError) {
        setError(requestError?.message ?? 'The AI request failed.')
      } finally {
        setPending(false)
      }
    },
    [draft, pending, activeId, task, aiContext],
  )

  const regenerate = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
    if (lastUserMessage) submit(lastUserMessage.text)
  }, [messages, submit])

  const copyMessage = useCallback((id, text) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedId(id)
        setTimeout(() => setCopiedId((current) => (current === id ? '' : current)), 1500)
      })
      .catch(() => {})
  }, [])

  /* ---------------------------------------------------------------- render */

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-aqua-500 dark:text-aqua-400" />
            AI Assistant
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {placeholder}. Grounded in the {myCourses.length || 'no'}{' '}
            {myCourses.length === 1 ? 'course' : 'courses'} you
            {isInstructor ? ' teach' : "'re enrolled in"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Export
            </button>
          )}
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aqua-500 text-slate-950 text-xs font-bold uppercase tracking-widest hover:bg-aqua-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New chat
          </button>
        </div>
      </header>

      {isDemo && (
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3">
          You are in the demo workspace. The AI endpoint is not available here — sign in with a real
          account to use the assistant.
        </p>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* ------------------------------------------------------ history */}
        <aside className="hidden lg:flex flex-col min-h-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 px-1">
            Chat history
          </h2>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1 pr-1">
            {chats.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 px-1">
                No conversations yet.
              </p>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                  chat.id === activeId
                    ? 'bg-aqua-500/10 border border-aqua-400/30'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(chat.id)
                    setError('')
                  }}
                  className="flex-1 text-left min-w-0"
                >
                  <span className="block text-sm text-slate-800 dark:text-slate-200 truncate">
                    {chat.title || 'New chat'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeChat(chat.id)}
                  aria-label={`Delete chat: ${chat.title || 'New chat'}`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* ---------------------------------------------------- transcript */}
        <section className="flex flex-col min-h-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
          <div className="flex gap-1.5 p-2 border-b border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {TOOLS.map((tool) => {
              const Icon = tool.icon
              const selected = tool.id === task
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setTask(tool.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                    selected
                      ? 'bg-aqua-500 text-slate-950'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tool.label}
                </button>
              )
            })}
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-5">
            {messages.length === 0 && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-aqua-500/10 border border-aqua-400/30 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-aqua-500 dark:text-aqua-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isInstructor ? 'Plan, draft and assess' : 'Study smarter'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                  {placeholder}. The assistant can see your course titles, lectures, materials and
                  assignments.
                </p>
              </div>
            )}

            {messages.map((message) => {
              const mine = message.role === 'user'
              return (
                <div key={message.id} className={`flex gap-3 ${mine ? 'justify-end' : ''}`}>
                  {!mine && (
                    <span className="w-8 h-8 shrink-0 rounded-xl bg-aqua-500/10 border border-aqua-400/30 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-aqua-500 dark:text-aqua-400" />
                    </span>
                  )}
                  <div className={`max-w-[85%] ${mine ? 'items-end' : ''} flex flex-col gap-1.5`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        mine
                          ? 'bg-aqua-500 text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {message.text}
                    </div>
                    {!mine && (
                      <button
                        type="button"
                        onClick={() => copyMessage(message.id, message.text)}
                        className="self-start text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-aqua-500 transition-colors inline-flex items-center gap-1"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {mine && (
                    <span className="w-8 h-8 shrink-0 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </span>
                  )}
                </div>
              )
            })}

            {pending && (
              <div className="flex gap-3">
                <span className="w-8 h-8 shrink-0 rounded-xl bg-aqua-500/10 border border-aqua-400/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-aqua-500 dark:text-aqua-400" />
                </span>
                <div className="rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}

            {error && (
              <ErrorPanel
                message={error}
                onRetry={messages.some((message) => message.role === 'user') ? regenerate : null}
                onDismiss={() => setError('')}
              />
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
            className="p-3 border-t border-slate-200 dark:border-white/10"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    submit()
                  }
                }}
                rows={2}
                placeholder={placeholder}
                aria-label={placeholder}
                className="flex-1 resize-none bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-aqua-400 focus:ring-1 focus:ring-aqua-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 custom-scrollbar"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                aria-label="Send message"
                className="h-11 w-11 shrink-0 rounded-2xl bg-aqua-500 text-slate-950 flex items-center justify-center hover:bg-aqua-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-2 px-1 text-[11px] text-slate-400 dark:text-slate-500">
              Enter to send · Shift + Enter for a new line
              {messages.some((message) => message.role === 'assistant') && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={pending}
                    className="font-bold uppercase tracking-widest hover:text-aqua-500 disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </>
              )}
            </p>
          </form>
        </section>
      </div>

    </div>
  )
}

export default AIAssistantView
