import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Mic,
  FileText,
  X,
  Download,
  Trash2,
  Edit3,
  ClipboardList,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Square,
  Lock,
} from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import * as store from '../services/store'
import { uploadFile as uploadToStorage } from '../services/upload'
import CourseParticipants from '../components/CourseParticipants'
import AudioPlayer from '../components/AudioPlayer'

const timestampOf = (value) => {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatDateTime = (value) => {
  const ms = timestampOf(value)
  if (!ms) return 'No due date'
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CoursePodcastCard = ({ pod, isInstructor, openEditModal, requestDelete, speaking, onToggleSpeech }) => (
  <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border hairline transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,229,255,0.15)] group relative overflow-hidden flex flex-col">
    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors duration-500 blur-xl" />

    <div className="flex justify-between items-start mb-6 gap-3">
      <div className="min-w-0">
        <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">
          {pod.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
          {pod.description}
        </p>
        {pod.isPublic === false && (
          <span className="inline-block mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border hairline">
            Private — enrolled students only
          </span>
        )}
      </div>
      {isInstructor && (
        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-950/50 p-1.5 rounded-xl border hairline shrink-0">
          <button
            type="button"
            onClick={() => openEditModal(pod, 'podcasts')}
            aria-label={`Edit ${pod.title}`}
            className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => requestDelete(pod.id, 'podcasts')}
            aria-label={`Delete ${pod.title}`}
            className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>

    <div className="mt-auto mb-6">
      <AudioPlayer key={pod.fileUrl ?? pod.id} src={pod.fileUrl} title={pod.title} />
    </div>

    <button
      type="button"
      onClick={onToggleSpeech}
      className="flex items-center space-x-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors bg-cyan-500/10 px-4 py-3 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 w-fit"
    >
      {speaking ? (
        <>
          <Square className="w-4 h-4 fill-current" /> <span>Stop Reading</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" /> <span>Read Out Loud</span>
        </>
      )}
    </button>
  </div>
)

const CourseDetailView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { courses, currentUser, patchUser } = useAppContext()

  const course = courses.find((c) => c.id === id)
  const isInstructor = Boolean(course) && currentUser?.uid === course.instructorId
  const isEnrolled = Boolean(course) && Boolean(currentUser?.joinedCourses?.includes(course.id))
  const canView = isInstructor || isEnrolled

  const [activeTab, setActiveTab] = useState('podcasts')

  const [podcasts, setPodcasts] = useState([])
  const [materials, setMaterials] = useState([])
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loadingMedia, setLoadingMedia] = useState(true)
  // Refreshed on a timer so"Past Due" flips over without a manual reload.
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [localError, setLocalError] = useState('')
  const [speakingId, setSpeakingId] = useState(null)
  const [actionError, setActionError] = useState('')

  // Universal Modals
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState('podcast')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPublic, setIsPublic] = useState(false)

  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentDesc, setAssignmentDesc] = useState('')
  const [assignmentDue, setAssignmentDue] = useState('')
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editItem, setEditItem] = useState({ id: '', type: '', title: '', desc: '', due: '' })
  const [isEditing, setIsEditing] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState({ id: '', type: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  const [downloadingId, setDownloadingId] = useState(null)
  const [enrolling, setEnrolling] = useState(false)

  // --- SUBMISSION MODAL STATES ---
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [activeAssignmentId, setActiveAssignmentId] = useState('')
  const [submitText, setSubmitText] = useState('')
  const [submitFile, setSubmitFile] = useState(null)
  const [isSubmittingWork, setIsSubmittingWork] = useState(false)

  // --- GRADING DASHBOARD STATES ---
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [gradingAssignmentId, setGradingAssignmentId] = useState('')
  const [gradingScores, setGradingScores] = useState({})
  const [isGrading, setIsGrading] = useState(false)

  const byNewest = (a, b) => timestampOf(b.createdAt) - timestampOf(a.createdAt)

  useEffect(() => {
    if (!canView) return undefined

    const unsubPodcasts = store.onSnapshot(
      store.query(store.collection(store.db, 'podcasts'), store.where('courseId', '==', id)),
      (snapshot) => setPodcasts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
      (error) => console.error('Podcasts snapshot error:', error),
    )

    const unsubMaterials = store.onSnapshot(
      store.query(store.collection(store.db, 'materials'), store.where('courseId', '==', id)),
      (snapshot) => setMaterials(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
      (error) => console.error('Materials snapshot error:', error),
    )

    const unsubAssignments = store.onSnapshot(
      store.query(store.collection(store.db, 'assignments'), store.where('courseId', '==', id)),
      (snapshot) => setAssignments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)),
      (error) => console.error('Assignments snapshot error:', error),
    )

    const unsubSubmissions = store.onSnapshot(
      store.query(store.collection(store.db, 'submissions'), store.where('courseId', '==', id)),
      (snapshot) => {
        setSubmissions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoadingMedia(false)
      },
      (error) => {
        console.error('Submissions snapshot error:', error)
        setLoadingMedia(false)
      },
    )

    return () => {
      unsubPodcasts()
      unsubMaterials()
      unsubAssignments()
      unsubSubmissions()
    }
  }, [id, canView])

  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    },
    [],
  )

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleSpeech = (itemId, text) => {
    if (speakingId === itemId) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }
    if (!('speechSynthesis' in window)) {
      setActionError('Text-to-speech is not supported in this browser.')
      return
    }
    if (!text) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
    setSpeakingId(itemId)
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    setIsUploading(true)
    setLocalError('')

    try {
      const secureUrl = await uploadToStorage(uploadFile)
      const extension = uploadFile.name.split('.').pop()
      const collectionName = uploadType === 'podcast' ? 'podcasts' : 'materials'

      await store.addDoc(store.collection(store.db, collectionName), {
        courseId: id,
        title: uploadTitle.trim(),
        description: uploadDesc.trim(),
        fileUrl: secureUrl,
        fileExtension: extension,
        instructorId: currentUser.uid,
        instructorName: currentUser.fullName,
        createdAt: store.serverTimestamp(),
        ...(uploadType === 'podcast' && { isPublic, likes: [], playCount: 0 }),
      })

      setShowUploadModal(false)
      setUploadTitle('')
      setUploadDesc('')
      setUploadFile(null)
      setIsPublic(false)
    } catch (err) {
      console.error(err)
      setLocalError(err.message ?? 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateAssignment = async (e) => {
    e.preventDefault()
    setIsCreatingAssignment(true)
    setLocalError('')
    try {
      await store.addDoc(store.collection(store.db, 'assignments'), {
        courseId: id,
        title: assignmentTitle.trim(),
        description: assignmentDesc.trim(),
        dueDate: assignmentDue,
        instructorId: currentUser.uid,
        createdAt: store.serverTimestamp(),
      })
      setShowAssignmentModal(false)
      setAssignmentTitle('')
      setAssignmentDesc('')
      setAssignmentDue('')
    } catch (err) {
      console.error(err)
      setLocalError(err.message ?? 'Could not post the assignment.')
    } finally {
      setIsCreatingAssignment(false)
    }
  }

  const isOverdue = (dueDateString) => {
    const ms = timestampOf(dueDateString)
    return ms > 0 && (nowMs || Number.POSITIVE_INFINITY) > ms
  }

  const requestDelete = (itemId, type) => {
    setItemToDelete({ id: itemId, type })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    setLocalError('')
    try {
      await store.deleteDoc(store.doc(store.db, itemToDelete.type, itemToDelete.id))
      setShowDeleteConfirm(false)
    } catch (err) {
      console.error(err)
      setLocalError('Failed to delete: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditModal = (item, type) => {
    setEditItem({ id: item.id, type, title: item.title, desc: item.description, due: item.dueDate || '' })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setIsEditing(true)
    setLocalError('')
    try {
      const updateData = { title: editItem.title.trim(), description: editItem.desc }
      if (editItem.type === 'assignments') updateData.dueDate = editItem.due
      await store.updateDoc(store.doc(store.db, editItem.type, editItem.id), updateData)
      setShowEditModal(false)
    } catch (err) {
      console.error(err)
      setLocalError('Failed to update: ' + err.message)
    } finally {
      setIsEditing(false)
    }
  }

  const handleDownload = async (fileUrl, title, extension, itemId) => {
    setDownloadingId(itemId)
    try {
      const response = await fetch(fileUrl, { mode: 'cors' }).catch(() => null)
      if (!response || !response.ok) throw new Error('Direct download blocked')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title}.${extension || 'pdf'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.warn('Streaming download failed, opening the file instead', error)
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    setActionError('')
    try {
      const nextCourses = [...(currentUser.joinedCourses ?? []), id]
      await store.updateDoc(store.doc(store.db, 'users', currentUser.uid), { joinedCourses: nextCourses })
      patchUser({ joinedCourses: nextCourses })
    } catch (err) {
      console.error(err)
      setActionError('Could not join this course. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingWork(true)
    setLocalError('')
    try {
      let finalFileUrl = null
      if (submitFile) finalFileUrl = await uploadToStorage(submitFile)

      await store.addDoc(store.collection(store.db, 'submissions'), {
        assignmentId: activeAssignmentId,
        courseId: id,
        studentId: currentUser.uid,
        studentName: currentUser.fullName,
        textContent: submitText.trim(),
        fileUrl: finalFileUrl,
        status: 'pending',
        score: null,
        submittedAt: store.serverTimestamp(),
      })

      setShowSubmitModal(false)
      setSubmitText('')
      setSubmitFile(null)
    } catch (err) {
      console.error(err)
      setLocalError(err.message ?? 'Submission failed.')
    } finally {
      setIsSubmittingWork(false)
    }
  }

  const handleGradeSubmission = async (subId, status) => {
    setIsGrading(true)
    try {
      const raw = gradingScores[subId]
      const parsed = raw === '' || raw === undefined ? 0 : Number(raw)
      const score = status === 'graded' ? Math.min(100, Math.max(0, Math.round(parsed))) : null
      await store.updateDoc(store.doc(store.db, 'submissions', subId), { status, score })
    } catch (err) {
      console.error(err)
    } finally {
      setIsGrading(false)
    }
  }

  const gradingSubmissions = useMemo(
    () => submissions.filter((s) => s.assignmentId === gradingAssignmentId),
    [submissions, gradingAssignmentId],
  )

  // While the courses collection is still loading, `course` is undefined — don't
  // accuse the user of a bad link before we have actually looked it up.
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-500 font-semibold tracking-wider uppercase text-sm">Loading course…</p>
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="max-w-md material-regular rounded-panel p-10 shadow-xl">
          <Lock className="w-14 h-14 text-cyan-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{course.title}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            You are not enrolled in this course. Ask <span className="font-semibold">{course.instructorName}</span> for
            the invite code, or join below if you already have it.
          </p>
          {actionError && <p className="text-red-500 text-sm font-semibold mb-4">{actionError}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleEnroll}
              disabled={enrolling}
              className="flex-1 py-3.5 rounded-2xl bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join this course'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3.5 rounded-2xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-8 py-6 pb-32 max-w-7xl mx-auto w-full relative">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="flex items-center space-x-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors mb-6 self-start font-semibold"
      >
        <ArrowLeft className="w-5 h-5" /> <span>Back to Dashboard</span>
      </button>

      {/* Premium Course Header */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border hairline relative overflow-hidden mb-8 shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-bl-full -z-10 blur-3xl" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="min-w-0">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">
              {course.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold tracking-wide uppercase mb-4 transition-colors">
              Instructor: <span className="text-cyan-600 dark:text-cyan-400">{course.instructorName}</span>
            </p>
            <p className="text-slate-700 dark:text-slate-300 text-base max-w-3xl leading-relaxed transition-colors">
              {course.description}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-2xl border hairline text-center shrink-0 shadow-inner transition-colors">
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest block mb-1 transition-colors">
              Course Code
            </span>
            <span className="text-2xl font-mono text-cyan-600 dark:text-cyan-400 tracking-widest">
              {course.courseCode}
            </span>
          </div>
        </div>
      </div>

      <CourseParticipants courseId={course.id} />

      {/* Modern Tabs */}
      <div
        role="tablist"
        aria-label="Course content"
        className="flex space-x-2 mb-8 bg-slate-100 dark:bg-slate-950/50 p-1.5 rounded-2xl border hairline w-full md:w-auto self-start transition-colors"
      >
        {[
          { key: 'podcasts', icon: Mic, label: 'Podcasts' },
          { key: 'materials', icon: FileText, label: 'Materials' },
          { key: 'assignments', icon: ClipboardList, label: 'Tasks' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === key
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {loadingMedia ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {activeTab === 'podcasts' && (
            <>
              {podcasts.length === 0 ? (
                <p className="text-slate-500 text-center py-12 col-span-full">No podcasts uploaded yet.</p>
              ) : (
                podcasts.map((pod) => (
                  <CoursePodcastCard
                    key={pod.id}
                    pod={pod}
                    isInstructor={isInstructor}
                    openEditModal={openEditModal}
                    requestDelete={requestDelete}
                    speaking={speakingId === pod.id}
                    onToggleSpeech={() => handleToggleSpeech(pod.id, pod.description)}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'materials' && (
            <>
              {materials.length === 0 ? (
                <p className="text-slate-500 text-center py-12 col-span-full">No materials uploaded yet.</p>
              ) : (
                materials.map((mat) => (
                  <div
                    key={mat.id}
                    className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-3xl border hairline flex justify-between items-center gap-4 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,229,255,0.1)] group"
                  >
                    <div className="flex items-start space-x-4 min-w-0">
                      <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border hairline group-hover:border-cyan-500/30 transition-colors shrink-0">
                        <BookOpen className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 tracking-tight truncate">
                          {mat.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{mat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(mat.fileUrl, mat.title, mat.fileExtension, mat.id)}
                        disabled={downloadingId === mat.id}
                        aria-label={`Download ${mat.title}`}
                        className="p-3 bg-cyan-500 text-slate-950 rounded-xl font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:bg-cyan-400 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        {downloadingId === mat.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </button>
                      {isInstructor && (
                        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl border hairline">
                          <button
                            type="button"
                            onClick={() => openEditModal(mat, 'materials')}
                            aria-label={`Edit ${mat.title}`}
                            className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(mat.id, 'materials')}
                            aria-label={`Delete ${mat.title}`}
                            className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'assignments' && (
            <>
              {assignments.length === 0 ? (
                <p className="text-slate-500 text-center py-12 col-span-full">No assignments posted yet.</p>
              ) : (
                assignments.map((asg) => {
                  const isLate = isOverdue(asg.dueDate)
                  const mySubmission = submissions.find(
                    (s) => s.assignmentId === asg.id && s.studentId === currentUser?.uid,
                  )

                  return (
                    <div
                      key={asg.id}
                      className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border hairline transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,229,255,0.15)] group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors duration-500 blur-xl" />

                      <div className="flex justify-between items-start mb-6 gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2 tracking-tight flex items-center space-x-3 flex-wrap transition-colors">
                            <span>{asg.title}</span>
                            {isLate && (
                              <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-md font-semibold border border-red-200 dark:border-red-500/30">
                                Past Due
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md leading-relaxed">
                            {asg.description}
                          </p>
                          <p className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-600 dark:text-cyan-500/80 bg-slate-100 dark:bg-slate-950/50 inline-block px-3 py-1.5 rounded-lg border hairline transition-colors">
                            Due: {formatDateTime(asg.dueDate)}
                          </p>
                        </div>
                        {isInstructor && (
                          <div className="flex space-x-2 bg-slate-100 dark:bg-slate-950/50 p-1.5 rounded-xl border hairline shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditModal(asg, 'assignments')}
                              aria-label={`Edit ${asg.title}`}
                              className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete(asg.id, 'assignments')}
                              aria-label={`Delete ${asg.title}`}
                              className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {!isInstructor ? (
                        <div className="mt-6 border-t hairline pt-6 transition-colors">
                          {mySubmission ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border hairline transition-colors">
                              <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center font-bold tracking-wide">
                                {mySubmission.status === 'graded' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                                ) : mySubmission.status === 'declined' ? (
                                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                                ) : (
                                  <Loader2 className="w-5 h-5 text-cyan-500 mr-2 animate-spin" />
                                )}
                                <span className="uppercase text-xs tracking-widest text-slate-500 mr-2">
                                  Status:
                                </span>
                                <span className="capitalize">{mySubmission.status}</span>
                              </span>
                              {mySubmission.score !== null && mySubmission.score !== undefined && (
                                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
                                  Score: {mySubmission.score}/100
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveAssignmentId(asg.id)
                                setShowSubmitModal(true)
                              }}
                              className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl shadow-contact hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:-translate-y-1 transition-all duration-300text-xs"
                            >
                              Submit Work
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-6 border-t hairline pt-6 transition-colors">
                          <button
                            type="button"
                            onClick={() => {
                              setGradingAssignmentId(asg.id)
                              setShowGradingModal(true)
                            }}
                            className="w-full py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold rounded-2xl border hairline transition-all hover:-translate-y-1 text-xsflex items-center justify-center space-x-2"
                          >
                            <ClipboardList className="w-4 h-4" />
                            <span>
                              Grade Submissions ({submissions.filter((s) => s.assignmentId === asg.id).length})
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </>
          )}
        </div>
      )}

      {/* INSTRUCTOR FLOATING ACTION BUTTONS */}
      {isInstructor && (
        <div className="fixed bottom-24 md:bottom-12 right-6 md:right-12 flex flex-col space-y-4 z-40">
          <button
            type="button"
            onClick={() => {
              setLocalError('')
              setShowAssignmentModal(true)
            }}
            aria-label="Create assignment"
            title="Create assignment"
            className="bg-slate-900 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 hover:bg-slate-800 transition-transform hover:scale-110 flex items-center justify-center group relative"
          >
            <ClipboardList className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLocalError('')
              setUploadType('podcast')
              setShowUploadModal(true)
            }}
            aria-label="Upload podcast"
            title="Upload podcast"
            className="bg-cyan-500 text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.5)] hover:bg-cyan-400 transition-transform hover:scale-110 flex items-center justify-center"
          >
            <Mic className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLocalError('')
              setUploadType('material')
              setShowUploadModal(true)
            }}
            aria-label="Upload material"
            title="Upload material"
            className="bg-slate-900 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 hover:bg-slate-800 transition-transform hover:scale-110 flex items-center justify-center group"
          >
            <BookOpen className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      )}

      {/* --- ALL MODALS --- */}

      {showUploadModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-colors"
          onClick={() => !isUploading && setShowUploadModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Upload ${uploadType}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900/90 border hairline rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors relative"
          >
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              aria-label="Close"
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center capitalize transition-colors">
              <span className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
              Upload {uploadType}
            </h2>
            {localError && (
              <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold border border-red-500/30">
                {localError}
              </div>
            )}
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="upload-title"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Title
                </label>
                <input
                  id="upload-title"
                  required
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
                />
              </div>
              <div>
                <label
                  htmlFor="upload-desc"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Description
                </label>
                <textarea
                  id="upload-desc"
                  required
                  rows="3"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="upload-file"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  File
                </label>
                <input
                  id="upload-file"
                  required
                  type="file"
                  accept={uploadType === 'podcast' ? 'audio/*' : '*/*'}
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:tracking-widest file:uppercase file:bg-cyan-500/10 file:text-cyan-600 dark:file:text-cyan-400 hover:file:bg-cyan-500/20 file:transition-colors file:cursor-pointer bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-300 dark:border-white/5 p-2 transition-colors"
                />
              </div>

              {uploadType === 'podcast' && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-300 dark:border-white/5 p-4 mt-2 transition-colors">
                  <div>
                    <span className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1transition-colors">
                      Global Discovery
                    </span>
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors">
                      Make this podcast public for anyone to listen.
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublic}
                    aria-label="Make this podcast public"
                    onClick={() => setIsPublic((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? 'bg-cyan-500 shadow-[0_0_10px_rgba(0,229,255,0.5)]' : 'bg-slate-400 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colorsflex justify-center items-center shadow-contact disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading…
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAssignmentModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-colors"
          onClick={() => !isCreatingAssignment && setShowAssignmentModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create assignment"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900/90 border hairline rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors relative"
          >
            <button
              type="button"
              onClick={() => setShowAssignmentModal(false)}
              aria-label="Close"
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center transition-colors">
              <span className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
              Create Assignment
            </h2>
            {localError && (
              <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold border border-red-500/30">
                {localError}
              </div>
            )}
            <form onSubmit={handleCreateAssignment} className="space-y-6">
              <div>
                <label
                  htmlFor="asg-title"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Task Title
                </label>
                <input
                  id="asg-title"
                  required
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
                />
              </div>
              <div>
                <label
                  htmlFor="asg-desc"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Instructions
                </label>
                <textarea
                  id="asg-desc"
                  required
                  rows="3"
                  value={assignmentDesc}
                  onChange={(e) => setAssignmentDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="asg-due"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Due Date &amp; Time
                </label>
                <input
                  id="asg-due"
                  required
                  type="datetime-local"
                  value={assignmentDue}
                  onChange={(e) => setAssignmentDue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-300 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingAssignment}
                className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colorsflex justify-center items-center shadow-contact disabled:opacity-50"
              >
                {isCreatingAssignment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-colors"
          onClick={() => !isEditing && setShowEditModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit item"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900/90 border hairline rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors relative"
          >
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              aria-label="Close"
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center capitalize transition-colors">
              <span className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
              Edit {editItem.type.replace(/s$/, '')}
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="edit-title"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Title
                </label>
                <input
                  id="edit-title"
                  required
                  type="text"
                  value={editItem.title}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-desc"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Description
                </label>
                <textarea
                  id="edit-desc"
                  rows="3"
                  value={editItem.desc}
                  onChange={(e) => setEditItem({ ...editItem, desc: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none"
                />
              </div>
              {editItem.type === 'assignments' && (
                <div>
                  <label
                    htmlFor="edit-due"
                    className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                  >
                    Due Date
                  </label>
                  <input
                    id="edit-due"
                    type="datetime-local"
                    value={editItem.due}
                    onChange={(e) => setEditItem({ ...editItem, due: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-300 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={isEditing}
                className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colorsflex justify-center items-center shadow-contact disabled:opacity-50"
              >
                {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-colors"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm delete"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900/90 border border-red-200 dark:border-red-500/30 rounded-[2.5rem] p-10 w-full max-w-sm shadow-[0_30px_60px_rgba(239,68,68,0.2)] text-center animate-in fade-in zoom-in-95 duration-200 transition-colors"
          >
            <div className="bg-red-100 dark:bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-500/30">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight transition-colors">
              Delete item?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 font-medium transition-colors">
              This action cannot be undone. Are you completely sure?
            </p>
            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors flex justify-center items-centertext-sm shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete Permanently'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 bg-transparent text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colorstext-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-colors"
          onClick={() => !isSubmittingWork && setShowSubmitModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Submit work"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900/90 border hairline rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors relative"
          >
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              aria-label="Close"
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center transition-colors">
              <span className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
              Submit Work
            </h2>
            <form onSubmit={handleStudentSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="submit-text"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Type Answer (Optional)
                </label>
                <textarea
                  id="submit-text"
                  rows="5"
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="submit-file"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2transition-colors"
                >
                  Attach File (Optional)
                </label>
                <input
                  id="submit-file"
                  type="file"
                  onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:tracking-widest file:uppercase file:bg-cyan-500/10 file:text-cyan-600 dark:file:text-cyan-400 hover:file:bg-cyan-500/20 file:transition-colors file:cursor-pointer bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-300 dark:border-white/5 p-2 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingWork || (!submitText.trim() && !submitFile)}
                className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colorsflex justify-center items-center shadow-contact disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingWork ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting…
                  </>
                ) : (
                  'Turn In Assignment'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showGradingModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-colors"
          onClick={() => setShowGradingModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Grading dashboard"
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-50 dark:bg-slate-900/90 border hairline rounded-[2.5rem] p-6 md:p-10 w-full max-w-4xl max-h-[85vh] overflow-y-auto relative shadow-[0_30px_60px_rgba(0,0,0,0.6)] custom-scrollbar animate-in fade-in zoom-in-95 duration-200 transition-colors"
          >
            <div className="sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md z-10 pb-6 mb-6 border-b hairline flex justify-between items-center pt-2 transition-colors">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center transition-colors">
                <span className="w-3 h-10 bg-cyan-400 rounded-full mr-4 shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
                Grading Dashboard
              </h2>
              <button
                type="button"
                onClick={() => setShowGradingModal(false)}
                aria-label="Close"
                className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-200 dark:bg-white/5 p-3 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {gradingSubmissions.length === 0 && (
                <div className="text-center py-20">
                  <ClipboardList className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-50 transition-colors" />
                  <p className="text-slate-600 dark:text-slate-400 font-bold tracking-wide text-lg transition-colors">
                    No submissions yet.
                  </p>
                </div>
              )}

              {gradingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border hairline relative overflow-hidden group shadow-sm dark:shadow-none transition-colors"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors duration-500 blur-xl" />

                  <div className="flex justify-between items-start mb-6 gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight mb-1">
                        {sub.studentName}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 transition-colors">
                        Submitted: {formatDateTime(sub.submittedAt)}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-colors ${
                        sub.status === 'graded'
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/30'
                          : sub.status === 'declined'
                            ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  {sub.textContent && (
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border hairline mb-6 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-medium transition-colors">
                      {sub.textContent}
                    </div>
                  )}

                  {sub.fileUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(sub.fileUrl, '_blank', 'noopener,noreferrer')}
                      className="flex items-center justify-center space-x-2 w-full md:w-auto text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-6 py-4 rounded-2xl border border-cyan-500/30 hover:bg-cyan-500/20 transition-all mb-6 text-sm font-semibold"
                    >
                      <Download className="w-4 h-4" /> <span>View Attached File</span>
                    </button>
                  )}

                  <div className="border-t hairline pt-6 flex flex-col sm:flex-row items-center gap-4 transition-colors">
                    <div className="flex-1 w-full flex items-center space-x-4 bg-slate-50 dark:bg-slate-950/50 p-2 pl-4 rounded-2xl border hairline transition-colors">
                      <label
                        htmlFor={`score-${sub.id}`}
                        className="text-slate-500 dark:text-slate-400 text-xs font-semibold transition-colors"
                      >
                        Score (0-100)
                      </label>
                      <input
                        id={`score-${sub.id}`}
                        type="number"
                        min="0"
                        max="100"
                        placeholder={sub.score !== null && sub.score !== undefined ? String(sub.score) : '--'}
                        onChange={(e) => setGradingScores((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono text-lg focus:border-cyan-400 focus:outline-none w-24 text-center transition-colors"
                      />
                    </div>
                    <div className="flex space-x-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleGradeSubmission(sub.id, 'declined')}
                        disabled={isGrading}
                        className="flex-1 sm:flex-none px-6 py-4 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-300 dark:border-white/10 hover:border-red-500/50 rounded-2xl transition-all font-bold text-xsdisabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGradeSubmission(sub.id, 'graded')}
                        disabled={isGrading}
                        className="flex-1 sm:flex-none px-6 py-4 bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-2xl transition-all hover:-translate-y-0.5 font-bold text-xsshadow-contact disabled:opacity-50"
                      >
                        Accept &amp; Grade
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDetailView
