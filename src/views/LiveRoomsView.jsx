import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Users, Loader2, X, Plus, PlayCircle, PhoneOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import * as store from '../services/store';

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
  const [endingId, setEndingId] = useState(null);

  // Instructor's active courses for the dropdown
  const myCourses = courses.filter((c) => c.instructorId === currentUser?.uid);

  useEffect(() => {
    if (!currentUser) return undefined;

    const unsubscribe = store.onSnapshot(
      store.collection(store.db, 'live_rooms'),
      (snapshot) => {
        const allRooms = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const filtered = allRooms.filter((room) => {
          if (room.status === 'ended') return false;
          if (isInstructor) return room.hostId === currentUser.uid;
          return currentUser.joinedCourses?.includes(room.courseId);
        });

        setLiveRooms(filtered);
        setLoading(false);
      },
      (error) => {
        console.error('Live rooms snapshot error:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [currentUser, isInstructor]);

  // A course can disappear from under an open dialog; treat that as"nothing selected".
  const validCourseId = myCourses.some((c) => c.id === selectedCourseId) ? selectedCourseId : '';

  const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!validCourseId || !roomTopic.trim()) {
      setLocalError('Please select a course and enter a topic.');
      return;
    }

    setIsCreating(true);
    setLocalError('');

    try {
      const taken = new Set(liveRooms.map((r) => r.roomId));
      let newRoomId = generateRoomId();
      let guard = 0;
      while (taken.has(newRoomId) && guard < 10) {
        newRoomId = generateRoomId();
        guard += 1;
      }

      await store.addDoc(store.collection(store.db, 'live_rooms'), {
        roomId: newRoomId,
        courseId: validCourseId,
        topic: roomTopic.trim(),
        hostId: currentUser.uid,
        hostName: currentUser.fullName,
        status: 'active',
        createdAt: store.serverTimestamp(),
      });

      setShowCreateModal(false);
      setRoomTopic('');
      setSelectedCourseId('');
      // Drop the host straight into the room they just opened.
      navigate(`/room/${newRoomId}`);
    } catch (err) {
      console.error(err);
      setLocalError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndRoom = async (room) => {
    setEndingId(room.id);
    try {
      await store.updateDoc(store.doc(store.db, 'live_rooms', room.id), { status: 'ended' });
    } catch (err) {
      console.error('Failed to end room:', err);
    } finally {
      setEndingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-32 max-w-5xl mx-auto w-full relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center">
          <div className="p-3 bg-red-500/10 rounded-2xl mr-4 border border-red-500/30">
            <Radio className="text-red-500 dark:text-red-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-wide transition-colors">
              Live Audio Rooms
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 transition-colors">
              {isInstructor ? 'Host live lectures and office hours.' : 'Join live audio sessions for your courses.'}
            </p>
          </div>
        </div>

        {isInstructor && (
          <button
            type="button"
            onClick={() => {
              setLocalError('');
              setShowCreateModal(true);
            }}
            className="py-3 px-6 bg-cyan-500 text-slate-950 font-bold rounded-xl shadow-contact hover:bg-cyan-400 transition-allflex items-center justify-center shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" /> Create Live Room
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-500 font-semibold tracking-wider uppercase text-sm">Syncing Live Rooms…</p>
        </div>
      ) : liveRooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 backdrop-blur-md border-dashed border-2 border-slate-300 dark:border-slate-800 p-12 rounded-3xl text-center transition-colors">
          <Radio className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">No Active Rooms</h3>
          <p className="text-slate-600 dark:text-slate-500 transition-colors">
            {isInstructor
              ? "You aren't hosting any live rooms right now."
              : 'None of your instructors are currently live.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveRooms.map((room) => {
            const relatedCourse = courses.find((c) => c.id === room.courseId);

            return (
              <div
                key={room.id}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all hover:border-cyan-500/50 group shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors" />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                    </span>
                    <span className="text-green-600 dark:text-green-400 text-sm font-semibold">Live Now</span>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 transition-colors">
                    ID: {room.roomId}
                  </span>
                </div>

                <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2 line-clamp-2 transition-colors">
                  {room.topic}
                </h3>

                <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm mb-6 space-x-2 transition-colors">
                  <Users className="w-4 h-4" />
                  <span>
                    Host: <span className="text-cyan-600 dark:text-cyan-400 font-medium">{room.hostName}</span>
                  </span>
                </div>

                {relatedCourse && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 flex items-center justify-between transition-colors">
                    <div>
                      <p className="text-xs text-slate-500font-bold mb-1">Course</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate pr-4 transition-colors">
                        {relatedCourse.title}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/room/${room.roomId}`)}
                    className="flex-1 py-4 bg-slate-800 hover:bg-cyan-950 text-cyan-400 font-bold rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all flex justify-center items-center group-hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" /> {isInstructor ? 'Enter Your Room' : 'Join Room'}
                  </button>

                  {isInstructor && (
                    <button
                      type="button"
                      onClick={() => handleEndRoom(room)}
                      disabled={endingId === room.id}
                      aria-label="End this room"
                      title="End this room"
                      className="px-4 py-4 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {endingId === room.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <PhoneOff className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSTRUCTOR: Create Room Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isCreating && setShowCreateModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create live room"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md relative shadow-2xl transition-colors"
          >
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors p-2 rounded-full bg-slate-100 dark:bg-white/5"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Go Live</h2>

            {localError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm font-semibold">
                {localError}
              </div>
            )}

            {myCourses.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                You need at least one course before you can host a live room. Create a course from your dashboard first.
              </p>
            ) : (
              <form onSubmit={handleCreateRoom} className="space-y-5">
                <div>
                  <label
                    htmlFor="room-course"
                    className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2"
                  >
                    Course
                  </label>
                  <select
                    id="room-course"
                    required
                    value={validCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                  >
                    <option value="" disabled>
                      Select a course…
                    </option>
                    {myCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="room-topic"
                    className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2"
                  >
                    Session Topic
                  </label>
                  <input
                    id="room-topic"
                    required
                    type="text"
                    value={roomTopic}
                    onChange={(e) => setRoomTopic(e.target.value)}
                    placeholder="e.g. Chapter 4 revision Q&A"
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl hover:bg-cyan-400 transition-colorsflex justify-center items-center disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Broadcasting'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveRoomsView;
