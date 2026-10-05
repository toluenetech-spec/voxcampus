import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, PhoneOff, ArrowLeft, Radio } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import * as store from '../services/store'

// The ZegoCloud app id / server secret identify the live-audio project. Move
// them to .env for anything beyond local testing — the server secret can mint
// tokens for any room on the account.
// No credentials are bundled: the server secret can mint tokens for any room on
// the account, so it has to come from the environment. Without it the room page
// still renders everything except the live audio bridge.
const ZEGO_APP_ID = Number(import.meta.env.VITE_ZEGO_APP_ID)
const ZEGO_SERVER_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET
const ZEGO_CONFIGURED = Number.isFinite(ZEGO_APP_ID) && ZEGO_APP_ID > 0 && Boolean(ZEGO_SERVER_SECRET)

const InviteBox = ({ roomId }) => {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300/80 bg-slate-950/70 border border-white/10 px-3 py-1.5 rounded-lg hover:border-cyan-500/50 transition-colors w-fit"
    >
      {copied ? 'Copied!' : `Invite ID: ${roomId}`}
    </button>
  )
}

const LiveRoomDetailView = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { currentUser, courses, isDemo } = useAppContext()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isEnding, setIsEnding] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [zegoError, setZegoError] = useState('')

  const zpRef = useRef(null)
  const containerRef = useRef(null)
  const exitingRef = useRef(false)

  const destroyZego = useCallback(() => {
    if (zpRef.current) {
      try {
        zpRef.current.destroy()
      } catch (error) {
        console.error('Failed to tear down the live session', error)
      }
      zpRef.current = null
    }
  }, [])

  const handleGracefulExit = useCallback(() => {
    if (exitingRef.current) return
    exitingRef.current = true
    setIsExiting(true)
    destroyZego()
    setTimeout(() => navigate('/live', { replace: true }), 120)
  }, [destroyZego, navigate])

  useEffect(() => () => destroyZego(), [destroyZego])

  useEffect(() => {
    if (!roomId || !currentUser) return undefined

    const q = store.query(store.collection(store.db, 'live_rooms'), store.where('roomId', '==', roomId))

    const unsubscribe = store.onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const roomData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }

          // Trapdoor: everyone leaves as soon as the host ends the session.
          if (roomData.status === 'ended') {
            handleGracefulExit()
            return
          }

          const isHost = currentUser.uid === roomData.hostId
          const isEnrolled = currentUser.joinedCourses?.includes(roomData.courseId)

          if (!isHost && !isEnrolled) {
            setAccessDenied(true)
            setErrorMessage('Access Denied: You must be enrolled in this course to join the live session.')
          } else {
            setRoom(roomData)
          }
        } else {
          setRoom(null)
          setErrorMessage('Room not found or the host has ended the session.')
        }
        setLoading(false)
      },
      (error) => {
        console.error('Room snapshot error:', error)
        setErrorMessage('Failed to connect to the server.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [roomId, currentUser, handleGracefulExit])

  const handleEndClass = async () => {
    if (!room || currentUser?.uid !== room.hostId) return
    setIsEnding(true)
    try {
      await store.updateDoc(store.doc(store.db, 'live_rooms', room.id), { status: 'ended' })
      // The snapshot listener catches the change and walks everyone out.
    } catch (error) {
      console.error('Failed to end class:', error)
      setIsEnding(false)
    }
  }

  /**
   * Ref callback that joins the ZegoCloud room.
   *
   * This must be stable across renders: an inline (or async) callback makes
   * React detach and re-attach the node on every render, which used to spawn a
   * brand new Zego instance each time and left the previous one running.
   */
  const joinMeeting = useCallback(
    (element) => {
      containerRef.current = element

      if (!element || !room || accessDenied || isDemo || !ZEGO_CONFIGURED || zpRef.current) return

      let cancelled = false

      import('@zegocloud/zego-uikit-prebuilt')
        .then(({ ZegoUIKitPrebuilt }) => {
          if (cancelled || !containerRef.current) return

          const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            ZEGO_APP_ID,
            ZEGO_SERVER_SECRET,
            roomId,
            currentUser.uid,
            currentUser?.fullName || 'User',
          )

          const zp = ZegoUIKitPrebuilt.create(kitToken)
          zpRef.current = zp

          const role = currentUser.uid === room.hostId ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience

          zp.joinRoom({
            container: containerRef.current,
            scenario: { mode: ZegoUIKitPrebuilt.LiveStreaming },
            role,
            turnOnCameraWhenJoining: false,
            showMyCameraToggleButton: false,
            turnOnMicrophoneWhenJoining: role === ZegoUIKitPrebuilt.Host,
            showVideoView: false,
            showScreenSharingButton: false,
            showUserList: true,
            onLeaveRoom: () => handleGracefulExit(),
          })
        })
        .catch((error) => {
          console.error('Could not load the live audio SDK:', error)
          if (!cancelled) setZegoError('The live audio SDK could not be loaded. Check your connection and retry.')
        })

      return () => {
        cancelled = true
      }
    },
    // `room` is intentionally included: the SDK needs the resolved host id, and
    // the guard above prevents a second join once a session exists.
    [room, accessDenied, isDemo, roomId, currentUser, handleGracefulExit],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
        <p className="text-cyan-500/50 text-sm font-bold uppercase tracking-widest">Verifying Access…</p>
      </div>
    )
  }

  // Error State (Room doesn't exist OR Access Denied)
  if (!room || accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 p-10 rounded-3xl max-w-md shadow-[0_20px_50px_rgba(239,68,68,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full -z-10 blur-xl" />
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            {accessDenied ? 'Access Denied' : 'Room Unavailable'}
          </h2>
          <p className="text-slate-400 mb-8 font-medium leading-relaxed">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/live', { replace: true })}
            className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 transition-all uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            Back to Live Rooms
          </button>
        </div>
      </div>
    )
  }

  const relatedCourse = courses.find((c) => c.id === room.courseId)
  const isHost = currentUser?.uid === room.hostId

  if (room.status === 'ended' || isExiting) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center text-white">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
        <p className="text-cyan-500/50 text-sm font-bold uppercase tracking-widest">
          Closing session and releasing your microphone…
        </p>
      </div>
    )
  }

  const liveAudioAvailable = ZEGO_CONFIGURED && !isDemo

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white flex flex-col relative overflow-hidden selection:bg-cyan-500/30">
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between text-center md:text-left relative z-10 pt-safe mb-4 gap-4 w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center space-x-3 mb-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleGracefulExit}
              aria-label="Leave room"
              className="p-2 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-inner w-fit">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">Live Room</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-md mb-2">{room.topic}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {relatedCourse && (
              <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 w-fit">
                {relatedCourse.title}
              </p>
            )}
            <InviteBox roomId={room.roomId} />
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Hosted by <span className="text-slate-200 font-semibold">{room.hostName}</span>
          </p>
        </div>

        {isHost && (
          <div className="flex justify-center md:justify-end mt-2 md:mt-0">
            <button
              type="button"
              onClick={handleEndClass}
              disabled={isEnding}
              className="flex items-center space-x-2 bg-slate-950/80 hover:bg-red-500/20 text-red-500 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50"
            >
              {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
              <span>End Class</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pb-8 z-10 flex flex-col items-center justify-center">
        <div className="w-full h-[70vh] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group p-1">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-bl-full -z-10 group-hover:bg-cyan-500/20 transition-colors duration-500 blur-3xl" />

          {liveAudioAvailable ? (
            <div ref={joinMeeting} className="w-full h-full rounded-2xl overflow-hidden glass" />
          ) : (
            <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center text-center p-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Radio className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Room is open, audio bridge is not</h2>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                {isDemo
                  ? 'Live audio needs the real VoxCampus backend. Sign in with an account to start broadcasting.'
                  : 'Set VITE_ZEGO_APP_ID and VITE_ZEGO_SERVER_SECRET in .env to enable the ZegoCloud audio bridge.'}
              </p>
              {zegoError && <p className="text-red-400 text-xs font-semibold">{zegoError}</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default LiveRoomDetailView
