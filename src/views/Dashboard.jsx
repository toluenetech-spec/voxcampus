import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Loader2, X, GraduationCap, Copy, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db } from '../firebase/config';
import { collection, addDoc, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, courses } = useAppContext();
  const isInstructor = currentUser?.role === 'instructor';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' });

  // Filter courses
  const displayedCourses = isInstructor 
    ? courses.filter(c => c.instructorId === currentUser?.uid)
    : courses.filter(c => currentUser?.joinedCourses?.includes(c.id));

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;
    setIsSubmitting(true);
    setLocalError('');
    
    try {
      const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
      const newCourseCode = generateCode();

      await addDoc(collection(db, 'courses'), {
        title: courseTitle,
        description: courseDesc,
        instructorId: currentUser.uid,
        instructorName: currentUser.fullName,
        courseCode: newCourseCode,
        createdAt: serverTimestamp()
      });

      setShowCreateModal(false);
      setCourseTitle('');
      setCourseDesc('');
      showToast("Course created successfully!");
    } catch (err) {
      setLocalError("Failed to create course: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCourse = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setJoinError('');

    try {
      const targetCourse = courses.find(c => c.courseCode.toUpperCase() === joinCode.toUpperCase());
      
      if (!targetCourse) {
        throw new Error("Invalid course code. Please check and try again.");
      }

      if (currentUser.joinedCourses?.includes(targetCourse.id)) {
        throw new Error("You are already enrolled in this course.");
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        joinedCourses: arrayUnion(targetCourse.id)
      });

      // Optimistically update context to avoid forcing a full reload
      currentUser.joinedCourses = [...(currentUser.joinedCourses || []), targetCourse.id];

      setShowJoinModal(false);
      setJoinCode('');
      showToast("Successfully joined course!");
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    showToast(`Code copied: ${code}`);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen relative">
      
      {/* Toast Notification */}
      <div className={`fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 text-cyan-400 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center space-x-2 font-bold text-sm tracking-wide">
          <CheckCircle2 size={16} />
          <span>{toast.message}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2 drop-shadow-lg transition-colors">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Welcome back, <span className="text-cyan-500 dark:text-cyan-400">{currentUser?.fullName}</span>.</p>
          </div>
          
          {isInstructor ? (
            <button 
              onClick={() => { setLocalError(''); setShowCreateModal(true); }}
              className="py-4 px-8 bg-cyan-500 text-slate-950 font-bold rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Create Course
            </button>
          ) : (
            <button 
              onClick={() => { setJoinError(''); setShowJoinModal(true); }}
              className="py-4 px-8 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-bold rounded-2xl shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:bg-cyan-500/20 hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest flex items-center justify-center backdrop-blur-sm"
            >
              <GraduationCap className="w-5 h-5 mr-2" /> Join Course
            </button>
          )}
        </div>

        {/* Empty States */}
        {displayedCourses.length === 0 && (
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-12 rounded-3xl text-center shadow-lg dark:shadow-2xl flex flex-col items-center justify-center mt-10 transition-colors">
            <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Your curriculum is empty.</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {isInstructor 
                ? "Start building your digital classroom. Create a course to generate a unique invite code for your students." 
                : "You haven't joined any classes yet. Ask your instructor for a Course Code to get started."}
            </p>
            {isInstructor ? (
               <button onClick={() => setShowCreateModal(true)} className="text-cyan-400 font-bold tracking-widest uppercase hover:text-cyan-300 transition-colors flex items-center">
                 Create your first course <Plus size={16} className="ml-1"/>
               </button>
            ) : (
              <button onClick={() => setShowJoinModal(true)} className="text-cyan-400 font-bold tracking-widest uppercase hover:text-cyan-300 transition-colors flex items-center">
                 Join a course <Plus size={16} className="ml-1"/>
              </button>
            )}
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedCourses.map(course => (
            <div 
              key={course.id} 
              onClick={() => navigate(`/course/${course.id}`)}
              className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 md:p-8 rounded-[2rem] shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-xl dark:hover:shadow-[0_10px_40px_rgba(0,229,255,0.15)] transition-all duration-300 hover:-translate-y-2 cursor-pointer group flex flex-col h-full relative overflow-hidden"
            >
              {/* Premium Background Glow Effect inside card */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-bl-full -z-10 group-hover:bg-cyan-500/20 transition-colors duration-500 blur-xl"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen size={28} strokeWidth={1.5} />
                </div>
              </div>
              
              <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-3 tracking-tight line-clamp-2 transition-colors">{course.title}</h3>
              
              <div className="flex-1">
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">{course.description}</p>
              </div>
              
              <div className="border-t border-slate-200 dark:border-white/10 pt-5 mt-auto flex justify-between items-end transition-colors">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Instructor</p>
                  <p className="text-slate-200 font-semibold">{course.instructorName}</p>
                </div>
                
                {isInstructor && (
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Invite Code</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(course.courseCode); }}
                      className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors group/btn"
                    >
                      <span className="font-mono text-cyan-500 font-bold tracking-wider">{course.courseCode}</span>
                      <Copy size={12} className="text-slate-500 group-hover/btn:text-cyan-400" />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center transition-colors">
                <div className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
                Create Course
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"><X size={20}/></button>
            </div>
            
            {localError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold">{localError}</div>}
            
            <form onSubmit={handleCreateCourse} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Course Title</label>
                <input required type="text" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="e.g. Advanced Physics 301" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Description</label>
                <textarea required rows="4" value={courseDesc} onChange={e => setCourseDesc(e.target.value)} placeholder="What will students learn?" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center disabled:opacity-50 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={20} /> Initializing...</> : 'Launch Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT: Join Course Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center transition-colors">
                <div className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
                Join Course
              </h2>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"><X size={20}/></button>
            </div>
            
            {joinError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold">{joinError}</div>}
            
            <form onSubmit={handleJoinCourse} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">6-Character Invite Code</label>
                <input required type="text" maxLength={6} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. X7B9WQ" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono text-xl tracking-widest text-center uppercase" />
              </div>
              <button type="submit" disabled={isJoining || joinCode.length !== 6} className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center disabled:opacity-50 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                {isJoining ? <><Loader2 className="animate-spin mr-2" size={20} /> Verifying...</> : 'Enroll Now'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
