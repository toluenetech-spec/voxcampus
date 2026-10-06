import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Loader2, X, GraduationCap, Copy, CheckCircle2 } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import * as store from '../services/store'

const Dashboard = () => {
  const navigate = useNavigate()
  const { currentUser, courses, patchUser } = useAppContext()
  const isInstructor = currentUser?.role === 'instructor'

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef(null)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const showToast = useCallback((message) => {
    setToast({ show: true, message })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }, [])

  // Students see the courses they enrolled in; instructors see their own.
  const displayedCourses = isInstructor
    ? courses.filter((c) => c.instructorId === currentUser?.uid)
    : courses.filter((c) => currentUser?.joinedCourses?.includes(c.id))

  const generateCode = () =>
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    if (!courseTitle.trim()) return
    setIsSubmitting(true)
    setLocalError('')

    try {
      let newCourseCode = generateCode()
      // Extremely unlikely, but a duplicate code makes "join by code" ambiguous.
      const taken = new Set(courses.map((c) => (c.courseCode ?? '').toUpperCase()))
      let guard = 0
      while (taken.has(newCourseCode) && guard < 10) {
        newCourseCode = generateCode()
        guard += 1
      }

      await store.addDoc(store.collection(store.db, 'courses'), {
        title: courseTitle.trim(),
        description: courseDesc.trim(),
        instructorId: currentUser.uid,
        instructorName: currentUser.fullName,
        courseCode: newCourseCode,
        createdAt: store.serverTimestamp(),
      })

      setShowCreateModal(false)
      setCourseTitle('')
      setCourseDesc('')
      showToast('Course created successfully!')
    } catch (err) {
      console.error(err)
      setLocalError('Failed to create course: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinCourse = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setIsJoining(true)
    setJoinError('')

    try {
      const targetCourse = courses.find(
        (c) => (c.courseCode ?? '').toUpperCase() === joinCode.trim().toUpperCase(),
      )

      if (!targetCourse) throw new Error('Invalid course code. Please check and try again.')

      const alreadyJoined = (currentUser.joinedCourses ?? []).includes(targetCourse.id)
      if (alreadyJoined) throw new Error('You are already enrolled in this course.')

      const nextCourses = [...(currentUser.joinedCourses ?? []), targetCourse.id]

      await store.updateDoc(store.doc(store.db, 'users', currentUser.uid), {
        joinedCourses: nextCourses,
      })

      // Keep the dashboard in sync immediately instead of waiting for a reload.
      patchUser({ joinedCourses: nextCourses })

      setShowJoinModal(false)
      setJoinCode('')
      showToast('Successfully joined course!')
    } catch (err) {
      console.error(err)
      setJoinError(err.message)
    } finally {
      setIsJoining(false)
    }
  }

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      showToast(`Code copied: ${code}`)
    } catch {
      showToast(`Invite code: ${code}`)
    }
  }

  return (
    <div className="p-6 md:p-10 min-h-screen relative">
      {/* Toast Notification */}
      <div
        aria-live="polite"
        className={`fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 text-cyan-400 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center space-x-2 font-bold text-sm tracking-wide">
          <CheckCircle2 size={16} />
          <span>{toast.message}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2 transition-colors">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Welcome back,{' '}
              <span className="text-cyan-600 dark:text-cyan-400">{currentUser?.fullName ?? 'student'}</span>.
            </p>
          </div>

          {isInstructor ? (
            <button
              type="button"
              onClick={() => {
                setLocalError('')
                setShowCreateModal(true)
              }}
              className="py-4 px-8 bg-cyan-500 text-slate-950 font-bold rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Create Course
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setJoinError('')
                setShowJoinModal(true)
              }}
              className="py-4 px-8 bg-cyan-500/10 border border-cyan-500/50 text-cyan-600 dark:text-cyan-400 font-bold rounded-2xl shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:bg-cyan-500/20 hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest flex items-center justify-center"
            >
              <GraduationCap className="w-5 h-5 mr-2" /> Join Course
            </button>
          )}
        </div>

        {/* Empty States */}
        {displayedCourses.length === 0 && (
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-12 rounded-3xl text-center shadow-lg dark:shadow-2xl flex flex-col items-center justify-center mt-10 transition-colors">
            <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Your curriculum is empty.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {isInstructor
                ? 'Start building your digital classroom. Create a course to generate a unique invite code for your students.'
                : "You haven't joined any classes yet. Ask your instructor for a Course Code to get started."}
            </p>
            {isInstructor ? (
              <button
                type="button"
                onClick={() => {
                  setLocalError('')
                  setShowCreateModal(true)
                }}
                className="text-cyan-600 dark:text-cyan-400 font-bold tracking-widest uppercase hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors flex items-center"
              >
                Create your first course <Plus size={16} className="ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setJoinError('')
                  setShowJoinModal(true)
                }}
                className="text-cyan-600 dark:text-cyan-400 font-bold tracking-widest uppercase hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors flex items-center"
              >
                Join a course <Plus size={16} className="ml-1" />
              </button>
            )}
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedCourses.map((course) => (
            <div
              key={course.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/course/${course.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/course/${course.id}`)
                }
              }}
              className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 md:p-8 rounded-[2rem] shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-xl dark:hover:shadow-[0_10px_40px_rgba(0,229,255,0.15)] transition-all duration-300 hover:-translate-y-2 cursor-pointer group flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-bl-full -z-10 group-hover:bg-cyan-500/20 transition-colors duration-500 blur-xl" />

              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 text-cyan-500 dark:text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen size={28} strokeWidth={1.5} />
                </div>
              </div>

              <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-3 tracking-tight line-clamp-2 transition-colors">
                {course.title}
              </h3>

              <div className="flex-1">
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="border-t border-slate-200 dark:border-white/10 pt-5 mt-auto flex justify-between items-end transition-colors">
                <div className="min-w-0 pr-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Instructor</p>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold truncate">{course.instructorName}</p>
                </div>

                {isInstructor && (
                  <div className="flex flex-col items-end shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Invite Code</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(course.courseCode)
                      }}
                      className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group/btn"
                    >
                      <span className="font-mono text-cyan-600 dark:text-cyan-500 font-bold tracking-wider">
                        {course.courseCode}
                      </span>
                      <Copy size={12} className="text-slate-500 group-hover/btn:text-cyan-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* INSTRUCTOR: Create Course Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl"
          onClick={() => !isSubmitting && setShowCreateModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create course"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center transition-colors">
                <span className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                Create Course
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
                className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {localError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold">
                {localError}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-6">
              <div>
                <label
                  htmlFor="course-title"
                  className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors"
                >
                  Course Title
                </label>
                <input
                  id="course-title"
                  required
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Advanced Physics 301"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
                />
              </div>
              <div>
                <label
                  htmlFor="course-desc"
                  className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors"
                >
                  Description
                </label>
                <textarea
                  id="course-desc"
                  required
                  rows="4"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="What will students learn?"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center disabled:opacity-50 shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} /> Initializing…
                  </>
                ) : (
                  'Launch Course'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT: Join Course Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl"
          onClick={() => !isJoining && setShowJoinModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Join course"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center transition-colors">
                <span className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                Join Course
              </h2>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                aria-label="Close"
                className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {joinError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinCourse} className="space-y-6">
              <div>
                <label
                  htmlFor="join-code"
                  className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors"
                >
                  6-Character Invite Code
                </label>
                <input
                  id="join-code"
                  required
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="X7B9WQ"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono text-xl tracking-widest text-center uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={isJoining || joinCode.length !== 6}
                className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} /> Verifying…
                  </>
                ) : (
                  'Enroll Now'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
