import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, PhoneOff } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const LiveRoomDetailView = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser, courses } = useAppContext();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const zpRef = useRef(null);

  const handleGracefulExit = () => {
    setIsExiting(true);
    if (zpRef.current) {
      zpRef.current.destroy();
      zpRef.current = null;
    }
    setTimeout(() => {
      navigate('/dashboard');
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!db || !roomId || !currentUser) return;

    const q = query(collection(db, 'live_rooms'), where('roomId', '==', roomId));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const roomData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        
        // Trapdoor: Kick everyone out if the class has ended
        if (roomData.status === 'ended') {
          handleGracefulExit();
          return;
        }

        // Security Gating: Must be Instructor of the course OR enrolled Student
        const isHost = currentUser.uid === roomData.hostId;
        const isEnrolled = currentUser.joinedCourses?.includes(roomData.courseId);

        if (!isHost && !isEnrolled) {
          setAccessDenied(true);
          setErrorMessage("Access Denied: You must be enrolled in this course to join the live session.");
        } else {
          setRoom(roomData);
        }
      } else {
        setRoom(null);
        setErrorMessage("Room not found or the host has ended the session.");
      }
      setLoading(false);
    }, (error) => {
      console.error("Room Snapshot Error:", error);
      setErrorMessage("Failed to connect to the server.");
      setLoading(false);
    });

    return () => unsub();
  }, [roomId, currentUser, navigate]);

  const handleEndClass = async () => {
    if (!room || currentUser.uid !== room.hostId) return;
    setIsEnding(true);
    try {
      await updateDoc(doc(db, 'live_rooms', room.id), { status: 'ended' });
      // The onSnapshot listener will catch the status change and navigate everyone, including the host, to /dashboard
    } catch (error) {
      console.error("Failed to end class:", error);
      setIsEnding(false);
    }
  };

  const myMeeting = async (element) => {
    if (!element || !room || accessDenied) return;

    const appID = 696824210;
    const serverSecret = "3feb29d9d0e8bf781bd7c2688ee2075f";
    
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret, 
      roomId, 
      currentUser.uid, 
      currentUser?.fullName || 'User'
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current = zp;

    // Dynamically set Role
    const role = currentUser.uid === room.hostId ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience;

    zp.joinRoom({
      container: element,
      scenario: { 
        mode: ZegoUIKitPrebuilt.LiveStreaming 
      },
      role: role,
      turnOnCameraWhenJoining: false,
      showMyCameraToggleButton: false,
      turnOnMicrophoneWhenJoining: role === ZegoUIKitPrebuilt.Host,
      showVideoView: false,
      showScreenSharingButton: false,
      showUserList: true,
      onLeaveRoom: () => {
        handleGracefulExit();
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
        <p className="text-cyan-500/50 text-sm font-bold uppercase tracking-widest">Verifying Access...</p>
      </div>
    );
  }

  // Error State (Room doesn't exist OR Access Denied)
  if (!room || accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 p-10 rounded-3xl max-w-md shadow-[0_20px_50px_rgba(239,68,68,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full -z-10 blur-xl"></div>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80 shadow-inner" />
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            {accessDenied ? "Access Denied" : "Room Unavailable"}
          </h2>
          <p className="text-slate-400 mb-8 font-medium leading-relaxed">
            {errorMessage}
          </p>
          <button 
            onClick={() => {
              handleGracefulExit();
            }}
            className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 transition-all uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const relatedCourse = courses.find(c => c.id === room.courseId);
  const isHost = currentUser.uid === room.hostId;

  if (room?.status === 'ended' || isExiting) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center text-white"><Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" /><p className="text-cyan-500/50 text-sm font-bold uppercase tracking-widest">Closing session and cleaning up hardware...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white flex flex-col relative overflow-hidden selection:bg-cyan-500/30">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="px-6 py-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between text-center md:text-left relative z-10 pt-safe mb-4 gap-4 w-full max-w-5xl mx-auto">
        
        {/* Left Side: Room Info */}
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center space-x-3 mb-2 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-inner w-fit">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">Live Room</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-md mb-2">{room.topic}</h1>
          {relatedCourse && (
            <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 w-fit">
              {relatedCourse.title}
            </p>
          )}
        </div>

        {/* Right Side: Instructor Controls */}
        {isHost && (
          <div className="flex justify-center md:justify-end mt-2 md:mt-0">
            <button 
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

      {/* Main Content Area (ZegoCloud Container) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pb-8 z-10 flex flex-col items-center justify-center">
        
        {/* Glassmorphism Wrapper for ZegoCloud UI */}
        <div className="w-full h-[70vh] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group p-1">
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-bl-full -z-10 group-hover:bg-cyan-500/20 transition-colors duration-500 blur-3xl"></div>
           
           {/* ZegoCloud ref container */}
           <div ref={myMeeting} className="w-full h-full rounded-2xl overflow-hidden glass"></div>
        </div>

      </main>

    </div>
  );
};

export default LiveRoomDetailView;
