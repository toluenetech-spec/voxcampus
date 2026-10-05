import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Users, Loader2, X, Plus, PlayCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db } from '../firebase/config';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const LiveRoomsView = () => {
  const navigate = useNavigate();
  const { currentUser, courses } = useAppContext();
  const isInstructor = currentUser?.role === 'instructor';
  
  const [liveRooms, setLiveRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Instructor Create Room Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [localError, setLocalError] = useState('');

  // Instructor's active courses for the dropdown
  const myCourses = courses.filter(c => c.instructorId === currentUser?.uid);

  useEffect(() => {
    if (!db || !currentUser) return;

    const unsub = onSnapshot(collection(db, 'live_rooms'), (snapshot) => {
      const allRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Role-Based and Status Filtering
      const filtered = allRooms.filter(room => {
        if (room.status === 'ended') return false;
        
        if (isInstructor) {
          return room.hostId === currentUser.uid;
        } else {
          // Assuming joinedCourses stores the course document ID
          return currentUser.joinedCourses?.includes(room.courseId);
        }
      });

      setLiveRooms(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Live Rooms Snapshot Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser, isInstructor]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !roomTopic) {
      setLocalError("Please select a course and enter a topic.");
      return;
    }
    
    setIsCreating(true);
    setLocalError('');
    
    try {
      // Generate a random 6-character room ID
      const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();
      const newRoomId = generateRoomId();

      await addDoc(collection(db, 'live_rooms'), {
        roomId: newRoomId,
        courseId: selectedCourseId,
        topic: roomTopic,
        hostId: currentUser.uid,
        hostName: currentUser.fullName,
        status: 'active',
        createdAt: serverTimestamp()
      });

      setShowCreateModal(false);
      setRoomTopic('');
      setSelectedCourseId('');
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-32 max-w-5xl mx-auto w-full relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center">
          <div className="p-3 bg-red-500/10 rounded-2xl mr-4 border border-red-500/30">
            <Radio className="text-red-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-wide transition-colors">Live Audio Rooms</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 transition-colors">
              {isInstructor ? 'Host live lectures and office hours.' : 'Join live audio sessions for your courses.'}
            </p>
          </div>
        </div>

        {isInstructor && (
          <button 
            onClick={() => { setLocalError(''); setShowCreateModal(true); }}
            className="py-3 px-6 bg-cyan-500 text-slate-950 font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:bg-cyan-400 transition-all uppercase tracking-wider flex items-center justify-center shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" /> Create Live Room
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <p className="text-slate-500 font-semibold tracking-wider uppercase text-sm">Syncing Live Rooms...</p>
        </div>
      ) : liveRooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 backdrop-blur-md border-dashed border-2 border-slate-300 dark:border-slate-800 p-12 rounded-3xl text-center transition-colors">
          <Radio className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">No Active Rooms</h3>
          <p className="text-slate-600 dark:text-slate-500 transition-colors">
            {isInstructor 
              ? "You aren't hosting any live rooms right now." 
              : "None of your instructors are currently live."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveRooms.map(room => {
            const relatedCourse = courses.find(c => c.id === room.courseId);
            
            return (
              <div key={room.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all hover:border-cyan-500/50 group shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                    <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Live Now</span>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 transition-colors">
                    ID: {room.roomId}
                  </span>
                </div>

                <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2 line-clamp-2 transition-colors">{room.topic}</h3>
                
                <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm mb-6 space-x-2 transition-colors">
                  <Users className="w-4 h-4" /> 
                  <span>Host: <span className="text-cyan-500 dark:text-cyan-400 font-medium">{room.hostName}</span></span>
                </div>

                {relatedCourse && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 flex items-center justify-between transition-colors">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Course</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate pr-4 transition-colors">{relatedCourse.title}</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => navigate(`/room/${room.roomId}`)}
                  className="w-full py-4 bg-slate-800 hover:bg-cyan-950 text-cyan-400 font-bold rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all flex justify-center items-center group-hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                >
                  <PlayCircle className="w-5 h-5 mr-2" /> {isInstructor ? 'Enter Your Room' : 'Join Room'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* INSTRUCTOR: Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md relative shadow-2xl transition-colors">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center transition-colors">
              <Radio className="w-6 h-6 text-cyan-500 dark:text-cyan-400 mr-2" /> Create Live Room
            </h2>
            
            {localError && <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4 text-sm border border-red-500/30">{localError}</div>}
            
            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide transition-colors">Select Course</label>
                {myCourses.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-500 text-sm transition-colors">
                    You haven't created any courses yet.
                  </div>
                ) : (
                  <select 
                    required 
                    value={selectedCourseId} 
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none appearance-none transition-colors"
                  >
                    <option value="" disabled>-- Choose a Course --</option>
                    {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide transition-colors">Room Topic / Lecture Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g., Q&A on Async React"
                  value={roomTopic} 
                  onChange={e => setRoomTopic(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isCreating || myCourses.length === 0} 
                className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-wider flex justify-center items-center disabled:opacity-50"
              >
                {isCreating ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Launching...</> : 'Go Live'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveRoomsView;
