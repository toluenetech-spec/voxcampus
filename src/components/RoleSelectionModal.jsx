import React, { useState } from 'react';
import { Loader2, GraduationCap, Presentation } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAppContext } from '../context/AppContext';

const RoleSelectionModal = () => {
  const { currentUser, setCurrentUser } = useAppContext();
  const [loadingRole, setLoadingRole] = useState(null);

  const handleSelectRole = async (role) => {
    if (!currentUser?.uid) return;
    setLoadingRole(role);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { role });
      
      // Update local context so modal unmounts
      setCurrentUser(prev => ({ ...prev, role }));
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
      <div className="max-w-3xl w-full bg-slate-900/50 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center">
        
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 text-center">
          Welcome to VoxCampus! <span className="text-cyan-400">Choose your path.</span>
        </h2>
        <p className="text-slate-400 text-center mb-10 max-w-lg">
          Select how you want to use VoxCampus. You can change this later in your profile settings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* Student Card */}
          <div 
            onClick={() => handleSelectRole('student')}
            className={`relative group flex flex-col items-center text-center p-8 rounded-2xl border border-white/5 bg-white/5 hover:border-cyan-500 hover:bg-white/10 transition-all cursor-pointer overflow-hidden ${loadingRole === 'student' ? 'pointer-events-none opacity-80' : ''}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {loadingRole === 'student' ? <Loader2 className="w-10 h-10 animate-spin" /> : <GraduationCap className="w-10 h-10" />}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">Student</h3>
            <p className="text-slate-400">Listen to lectures, join live rooms, and learn.</p>
          </div>

          {/* Instructor Card */}
          <div 
            onClick={() => handleSelectRole('instructor')}
            className={`relative group flex flex-col items-center text-center p-8 rounded-2xl border border-white/5 bg-white/5 hover:border-cyan-500 hover:bg-white/10 transition-all cursor-pointer overflow-hidden ${loadingRole === 'instructor' ? 'pointer-events-none opacity-80' : ''}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {loadingRole === 'instructor' ? <Loader2 className="w-10 h-10 animate-spin" /> : <Presentation className="w-10 h-10" />}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">Instructor</h3>
            <p className="text-slate-400">Host live rooms, upload podcasts, and teach.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
