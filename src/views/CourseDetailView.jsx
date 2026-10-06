import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Mic, FileText, X, Download, Trash2, Edit3, ClipboardList, Loader2, AlertCircle, CheckCircle2, XCircle, Play, Pause } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db } from '../firebase/config';
import { collection, query, where, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import CourseParticipants from '../components/CourseParticipants';

const CoursePodcastCard = ({ pod, isInstructor, openEditModal, requestDelete }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error(err));
    }
  };

  const handleReadOutLoud = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(pod.description));
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,229,255,0.15)] group relative overflow-hidden flex flex-col">
       <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors duration-500 blur-xl"></div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">{pod.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md transition-colors">{pod.description}</p>
        </div>
        {isInstructor && (
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/50 p-1.5 rounded-xl border border-white/5">
            <button onClick={() => openEditModal(pod, 'podcasts')} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"><Edit3 className="w-4 h-4" /></button>
            <button onClick={() => requestDelete(pod.id, 'podcasts')} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      <div className="mt-auto mb-6 flex items-center space-x-4">
        {pod.fileUrl ? (
          <>
            <div 
              onClick={togglePlay}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white bg-cyan-500 transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 shrink-0 ${isPlaying ? 'shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-pulse' : ''}`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div className={`h-full bg-cyan-500 rounded-full transition-all duration-1000 ${isPlaying ? 'w-full animate-pulse' : 'w-0'}`}></div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{isPlaying ? 'Now Playing' : 'Listen Now'}</p>
            </div>
            <audio 
              ref={audioRef} 
              src={pod.fileUrl} 
              className="hidden" 
              onEnded={() => setIsPlaying(false)} 
            />
          </>
        ) : (
          <p className="text-red-500 text-sm italic py-2">Error: Audio link is missing from database.</p>
        )}
      </div>

      <button onClick={handleReadOutLoud} className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 px-4 py-3 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 w-fit">
        <Mic className="w-4 h-4" /> <span>Read Out Loud</span>
      </button>
    </div>
  );
};

const CourseDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, currentUser } = useAppContext();
  
  const course = courses.find(c => c.id === id);
  const isInstructor = currentUser?.uid === course?.instructorId;

  const [activeTab, setActiveTab] = useState('podcasts'); 
  
  const [podcasts, setPodcasts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  const [localError, setLocalError] = useState('');

  // Universal Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('podcast'); 
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDue, setAssignmentDue] = useState('');
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState({ id: '', type: '', title: '', desc: '', due: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ id: '', type: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const [downloadingId, setDownloadingId] = useState(null);

  // --- SUBMISSION MODAL STATES ---
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState('');
  const [submitText, setSubmitText] = useState('');
  const [submitFile, setSubmitFile] = useState(null);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // --- GRADING DASHBOARD STATES ---
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingAssignmentId, setGradingAssignmentId] = useState('');
  const [gradingScores, setGradingScores] = useState({}); // { submissionId: stringScore }
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    if (!db || !id) return;
    
    const podQ = query(collection(db, 'podcasts'), where('courseId', '==', id));
    const unsubPodcasts = onSnapshot(podQ, (snapshot) => {
      setPodcasts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const matQ = query(collection(db, 'materials'), where('courseId', '==', id));
    const unsubMaterials = onSnapshot(matQ, (snapshot) => {
      setMaterials(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const asgQ = query(collection(db, 'assignments'), where('courseId', '==', id));
    const unsubAssignments = onSnapshot(asgQ, (snapshot) => {
      setAssignments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const subQ = query(collection(db, 'submissions'), where('courseId', '==', id));
    const unsubSubmissions = onSnapshot(subQ, (snapshot) => {
      setSubmissions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingMedia(false); 
    });

    return () => {
      unsubPodcasts(); unsubMaterials(); unsubAssignments(); unsubSubmissions();
    };
  }, [id]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    setLocalError('');
    try {
      const extension = uploadFile.name.split('.').pop();
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('upload_preset', 'voxcampus_audio'); 
      const response = await fetch('https://api.cloudinary.com/v1_1/dngm8iodz/auto/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const collectionName = uploadType === 'podcast' ? 'podcasts' : 'materials';
      await addDoc(collection(db, collectionName), {
        courseId: id, title: uploadTitle, description: uploadDesc, fileUrl: data.secure_url, fileExtension: extension, instructorId: currentUser.uid, instructorName: currentUser.fullName, createdAt: serverTimestamp(),
        ...(uploadType === 'podcast' && { isPublic, likes: [], playCount: 0 })
      });

      setShowUploadModal(false); setUploadTitle(''); setUploadDesc(''); setUploadFile(null); setIsPublic(false);
    } catch (err) {
      setLocalError("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setIsCreatingAssignment(true);
    setLocalError('');
    try {
      await addDoc(collection(db, 'assignments'), {
        courseId: id, title: assignmentTitle, description: assignmentDesc, dueDate: assignmentDue, instructorId: currentUser.uid, createdAt: serverTimestamp()
      });
      setShowAssignmentModal(false); setAssignmentTitle(''); setAssignmentDesc(''); setAssignmentDue('');
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  const isOverdue = (dueDateString) => {
    if (!dueDateString) return false;
    return new Date() > new Date(dueDateString);
  };

  const requestDelete = (itemId, type) => { setItemToDelete({ id: itemId, type }); setShowDeleteConfirm(true); };
  
  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, itemToDelete.type, itemToDelete.id));
      setShowDeleteConfirm(false);
    } catch (err) {
      setLocalError("Failed to delete: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (item, type) => {
    setEditItem({ id: item.id, type, title: item.title, desc: item.description, due: item.dueDate || '' });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      const updateData = { title: editItem.title, description: editItem.desc };
      if (editItem.type === 'assignments') updateData.dueDate = editItem.due;
      await updateDoc(doc(db, editItem.type, editItem.id), updateData);
      setShowEditModal(false);
    } catch (err) {
      setLocalError("Failed to update: " + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDownload = async (fileUrl, title, extension, id) => {
    try {
      setDownloadingId(id);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.${extension || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      window.open(fileUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingWork(true);
    try {
      let finalFileUrl = null;
      if (submitFile) {
        const formData = new FormData();
        formData.append('file', submitFile);
        formData.append('upload_preset', 'voxcampus_audio'); 
        const response = await fetch('https://api.cloudinary.com/v1_1/dngm8iodz/auto/upload', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        finalFileUrl = data.secure_url;
      }
      
      await addDoc(collection(db, 'submissions'), {
        assignmentId: activeAssignmentId,
        courseId: id,
        studentId: currentUser.uid,
        studentName: currentUser.fullName,
        textContent: submitText,
        fileUrl: finalFileUrl,
        status: 'pending',
        score: null,
        submittedAt: serverTimestamp()
      });
      setShowSubmitModal(false); setSubmitText(''); setSubmitFile(null);
    } catch (err) {
      setLocalError("Submission failed: " + err.message);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleGradeSubmission = async (subId, status) => {
    setIsGrading(true);
    try {
      const score = gradingScores[subId] || 0;
      await updateDoc(doc(db, 'submissions', subId), { status, score: status === 'graded' ? Number(score) : null });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGrading(false);
    }
  };


  if (!course) return <div className="p-8 text-white text-center">Course not found.</div>;

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-8 py-6 pb-32 max-w-7xl mx-auto w-full relative">
      <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6 self-start font-semibold">
        <ArrowLeft className="w-5 h-5" /> <span>Back to Dashboard</span>
      </button>

      {/* Premium Course Header */}
      <div className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden mb-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-bl-full -z-10 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">{course.title}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold tracking-wide uppercase mb-4 transition-colors">Instructor: <span className="text-cyan-500 dark:text-cyan-400">{course.instructorName}</span></p>
            <p className="text-slate-700 dark:text-slate-300 text-base max-w-3xl leading-relaxed transition-colors">{course.description}</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-center shrink-0 shadow-inner transition-colors">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest block mb-1 transition-colors">Course Code</span>
            <span className="text-2xl font-mono text-cyan-400 tracking-widest drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{course.courseCode}</span>
          </div>
        </div>
      </div>

      <CourseParticipants courseId={course.id} />

      {/* Modern Tabs */}
      <div className="flex space-x-2 mb-8 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto self-start">
        <button onClick={() => setActiveTab('podcasts')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${activeTab === 'podcasts' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          <Mic className="w-4 h-4" /> <span className="hidden sm:inline">Podcasts</span>
        </button>
        <button onClick={() => setActiveTab('materials')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${activeTab === 'materials' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Materials</span>
        </button>
        <button onClick={() => setActiveTab('assignments')} className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${activeTab === 'assignments' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          <ClipboardList className="w-4 h-4" /> <span className="hidden sm:inline">Tasks</span>
        </button>
      </div>

      {loadingMedia ? (
        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-cyan-400 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {activeTab === 'podcasts' && (
            <>
              {podcasts.length === 0 && <p className="text-slate-500 text-center py-12 col-span-full">No podcasts uploaded yet.</p>}
              {podcasts.map(pod => (
                <CoursePodcastCard 
                  key={pod.id}
                  pod={pod}
                  isInstructor={isInstructor}
                  openEditModal={openEditModal}
                  requestDelete={requestDelete}
                />
              ))}
            </>
          )}

          {activeTab === 'materials' && (
            <>
              {materials.length === 0 && <p className="text-slate-500 text-center py-12 col-span-full">No materials uploaded yet.</p>}
              {materials.map(mat => (
                <div key={mat.id} className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex justify-between items-center transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,229,255,0.1)] group">
                  <div className="flex items-start space-x-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-white/5 group-hover:border-cyan-500/30 transition-colors"><BookOpen className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /></div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 tracking-tight transition-colors">{mat.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate transition-colors">{mat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => handleDownload(mat.fileUrl, mat.title, mat.fileExtension, mat.id)} disabled={downloadingId === mat.id} className="p-3 bg-cyan-500 text-slate-950 rounded-xl font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:bg-cyan-400 transition-all hover:-translate-y-0.5">
                      {downloadingId === mat.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                    {isInstructor && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/50 p-1 rounded-xl border border-white/5">
                        <button onClick={() => openEditModal(mat, 'materials')} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => requestDelete(mat.id, 'materials')} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'assignments' && (
            <>
              {assignments.length === 0 && <p className="text-slate-500 text-center py-12 col-span-full">No assignments posted yet.</p>}
              {assignments.map(asg => {
                const isLate = isOverdue(asg.dueDate);
                const mySubmission = submissions.find(s => s.assignmentId === asg.id && s.studentId === currentUser?.uid);
                
                return (
                  <div key={asg.id} className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,229,255,0.15)] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors duration-500 blur-xl"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2 tracking-tight flex items-center space-x-3 transition-colors">
                          <span>{asg.title}</span>
                          {isLate && <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] px-2 py-1 rounded-md uppercase tracking-widest font-bold border border-red-200 dark:border-red-500/30">Past Due</span>}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md leading-relaxed transition-colors">{asg.description}</p>
                        <p className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-500/80 bg-slate-950/50 inline-block px-3 py-1.5 rounded-lg border border-white/5">
                          Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleString() : 'No Due Date'}
                        </p>
                      </div>
                      {isInstructor && (
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/50 p-1.5 rounded-xl border border-white/5">
                          <button onClick={() => openEditModal(asg, 'assignments')} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => requestDelete(asg.id, 'assignments')} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>

                    {!isInstructor ? (
                      <div className="mt-6 border-t border-white/10 pt-6">
                        {mySubmission ? (
                          <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                            <span className="text-sm text-slate-300 flex items-center font-bold tracking-wide">
                              {mySubmission.status === 'graded' ? <CheckCircle2 className="w-5 h-5 text-green-400 mr-2" /> : 
                               mySubmission.status === 'declined' ? <XCircle className="w-5 h-5 text-red-400 mr-2" /> : 
                               <Loader2 className="w-5 h-5 text-cyan-400 mr-2 animate-spin" />}
                              <span className="uppercase text-[11px] tracking-widest text-slate-500 mr-2">Status:</span> 
                              <span className="capitalize">{mySubmission.status}</span>
                            </span>
                            {mySubmission.score !== null && <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">Score: {mySubmission.score}/100</span>}
                          </div>
                        ) : (
                          <button onClick={() => { setActiveAssignmentId(asg.id); setShowSubmitModal(true); }} className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-xs">
                            Submit Work
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-6 border-t border-white/10 pt-6">
                        <button onClick={() => { setGradingAssignmentId(asg.id); setShowGradingModal(true); }} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all hover:-translate-y-1 text-xs uppercase tracking-widest flex items-center justify-center space-x-2">
                          <ClipboardList className="w-4 h-4" /> <span>Grade Submissions ({submissions.filter(s => s.assignmentId === asg.id).length})</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

        </div>
      )}

      {/* INSTRUCTOR FLOATING ACTION BUTTONS */}
      {isInstructor && (
        <div className="fixed bottom-24 md:bottom-12 right-6 md:right-12 flex flex-col space-y-4 z-40">
          <button onClick={() => { setShowAssignmentModal(true); }} className="bg-slate-900 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 hover:bg-slate-800 transition-transform hover:scale-110 flex items-center justify-center group relative">
            <ClipboardList className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />
          </button>
          <button onClick={() => { setUploadType('podcast'); setShowUploadModal(true); }} className="bg-cyan-500 text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.5)] hover:bg-cyan-400 transition-transform hover:scale-110 flex items-center justify-center">
            <Mic className="w-6 h-6" />
          </button>
          <button onClick={() => { setUploadType('material'); setShowUploadModal(true); }} className="bg-slate-900 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 hover:bg-slate-800 transition-transform hover:scale-110 flex items-center justify-center group">
            <BookOpen className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      )}

      {/* --- ALL MODALS --- */}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center capitalize transition-colors">
               <div className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
               Upload {uploadType}
            </h2>
            {localError && <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold border border-red-500/30">{localError}</div>}
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Title</label>
                <input required type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Description</label>
                <textarea required rows="3" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">File</label>
                <input required type="file" accept={uploadType === 'podcast' ? 'audio/*' : '*/*'} onChange={e => setUploadFile(e.target.files[0])} className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:tracking-widest file:uppercase file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 file:transition-colors file:cursor-pointer bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-300 dark:border-white/5 p-2 transition-colors" />
              </div>
              
              {uploadType === 'podcast' && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-300 dark:border-white/5 p-4 mt-2 transition-colors">
                  <div>
                    <span className="block text-[11px] font-bold text-cyan-500 dark:text-cyan-400 mb-1 uppercase tracking-widest transition-colors">Global Discovery</span>
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors">Make this podcast public for anyone to listen.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-cyan-500 shadow-[0_0_10px_rgba(0,229,255,0.5)]' : 'bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}
              <button type="submit" disabled={isUploading} className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50">
                {isUploading ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Uploading...</> : 'Upload File'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <button onClick={() => setShowAssignmentModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center transition-colors">
              <div className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
              Create Assignment
            </h2>
            {localError && <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold border border-red-500/30">{localError}</div>}
            <form onSubmit={handleCreateAssignment} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Task Title</label>
                <input required type="text" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Instructions</label>
                <textarea required rows="3" value={assignmentDesc} onChange={e => setAssignmentDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Due Date & Time</label>
                <input required type="datetime-local" value={assignmentDue} onChange={e => setAssignmentDue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-300 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <button type="submit" disabled={isCreatingAssignment} className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50">
                {isCreatingAssignment ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Post Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal (Universal) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center capitalize transition-colors">
               <div className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
               Edit {editItem.type.slice(0, -1)}
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Title</label>
                <input required type="text" value={editItem.title} onChange={e => setEditItem({...editItem, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Description</label>
                <textarea required rows="3" value={editItem.desc} onChange={e => setEditItem({...editItem, desc: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none" />
              </div>
              {editItem.type === 'assignments' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Due Date</label>
                  <input type="datetime-local" value={editItem.due} onChange={e => setEditItem({...editItem, due: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-300 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              )}
              <button type="submit" disabled={isEditing} className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50">
                {isEditing ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-slate-900/90 border border-red-200 dark:border-red-500/30 rounded-[2.5rem] p-10 w-full max-w-sm shadow-[0_30px_60px_rgba(239,68,68,0.2)] text-center animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <div className="bg-red-100 dark:bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-500/30">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight transition-colors">Delete item?</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 font-medium transition-colors">This action cannot be undone. Are you completely sure?</p>
            <div className="flex flex-col space-y-3">
              <button onClick={confirmDelete} disabled={isDeleting} className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors flex justify-center items-center uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Delete Permanently'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-transparent text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors uppercase tracking-widest text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SUBMIT WORK MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <button onClick={() => setShowSubmitModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center transition-colors">
              <div className="w-2 h-8 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
              Submit Work
            </h2>
            <form onSubmit={handleStudentSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Type Answer (Optional)</label>
                <textarea rows="5" value={submitText} onChange={e => setSubmitText(e.target.value)} placeholder="Type your answer here..." className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-widest transition-colors">Attach File (Optional)</label>
                <input type="file" onChange={e => setSubmitFile(e.target.files[0])} className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:tracking-widest file:uppercase file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 file:transition-colors file:cursor-pointer bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-300 dark:border-white/5 p-2 transition-colors" />
              </div>
              <button type="submit" disabled={isSubmittingWork || (!submitText && !submitFile)} className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl mt-4 hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmittingWork ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Submitting...</> : 'Turn In Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INSTRUCTOR GRADING DASHBOARD MODAL */}
      {showGradingModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-colors">
          <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 md:p-10 w-full max-w-4xl max-h-[85vh] overflow-y-auto relative shadow-[0_30px_60px_rgba(0,0,0,0.6)] custom-scrollbar animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <div className="sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md z-10 pb-6 mb-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center pt-2 transition-colors">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center transition-colors">
                <div className="w-3 h-10 bg-cyan-400 rounded-full mr-4 shadow-[0_0_15px_rgba(0,229,255,0.5)]"></div>
                Grading Dashboard
              </h2>
              <button onClick={() => setShowGradingModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-200 dark:bg-white/5 p-3 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="space-y-6">
              {submissions.filter(s => s.assignmentId === gradingAssignmentId).length === 0 && (
                <div className="text-center py-20">
                  <ClipboardList className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-50 transition-colors" />
                  <p className="text-slate-600 dark:text-slate-400 font-bold tracking-wide text-lg transition-colors">No submissions yet.</p>
                </div>
              )}
              
              {submissions.filter(s => s.assignmentId === gradingAssignmentId).map(sub => (
                <div key={sub.id} className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -z-10 group-hover:bg-cyan-500/10 transition-colors duration-500 blur-xl"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight mb-1 transition-colors">{sub.studentName}</h4>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors">Submitted: {sub.submittedAt?.toDate().toLocaleString()}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-colors ${sub.status === 'graded' ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : sub.status === 'declined' ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}>
                      {sub.status}
                    </span>
                  </div>
                  
                  {sub.textContent && (
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 mb-6 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-medium transition-colors">
                      {sub.textContent}
                    </div>
                  )}
                  
                  {sub.fileUrl && (
                    <button onClick={() => window.open(sub.fileUrl, '_blank')} className="flex items-center justify-center space-x-2 w-full md:w-auto text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 px-6 py-4 rounded-2xl border border-cyan-500/30 hover:bg-cyan-500/20 transition-all mb-6 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:-translate-y-0.5">
                      <Download className="w-4 h-4" /> <span>View Attached File</span>
                    </button>
                  )}

                  <div className="border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center gap-4 transition-colors">
                    <div className="flex-1 w-full flex items-center space-x-4 bg-slate-50 dark:bg-slate-950/50 p-2 pl-4 rounded-2xl border border-slate-200 dark:border-white/5 transition-colors">
                      <label className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest transition-colors">Score (0-100)</label>
                      <input 
                        type="number" 
                        min="0" max="100" 
                        placeholder={sub.score !== null ? sub.score : "--"}
                        onChange={(e) => setGradingScores(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono text-lg focus:border-cyan-400 focus:outline-none w-24 text-center transition-colors"
                      />
                    </div>
                    <div className="flex space-x-3 w-full sm:w-auto">
                      <button onClick={() => handleGradeSubmission(sub.id, 'declined')} disabled={isGrading} className="flex-1 sm:flex-none px-6 py-4 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-300 dark:border-white/10 hover:border-red-500/50 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest">
                        Decline
                      </button>
                      <button onClick={() => handleGradeSubmission(sub.id, 'graded')} disabled={isGrading} className="flex-1 sm:flex-none px-6 py-4 bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-2xl transition-all hover:-translate-y-0.5 font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                        Accept & Grade
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
  );
};

export default CourseDetailView;
