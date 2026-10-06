import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Loader2, User, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db, auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const ProfileView = () => {
  const { currentUser } = useAppContext();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'voxcampus_audio'); 
      
      const response = await fetch('https://api.cloudinary.com/v1_1/dngm8iodz/auto/upload', { 
        method: 'POST', 
        body: formData 
      });
      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);
      
      const newUrl = data.secure_url;
      setAvatarUrl(newUrl);

      // Immediately save to Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { avatarUrl: newUrl });

    } catch (error) {
      console.error("Avatar upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName,
        bio,
        avatarUrl
      });
      
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Failed to save profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) return null;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 max-w-4xl mx-auto w-full transition-colors duration-300">
      
      <div className="flex items-center mb-8">
        <div className="p-3 bg-cyan-500/10 rounded-2xl mr-4 border border-cyan-500/30">
          <User className="text-cyan-500 dark:text-cyan-400 w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-wide">Your Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your personal information and preferences.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-300">
        
        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-xl font-semibold text-center text-sm transition-colors duration-300">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-8">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div 
              onClick={handleAvatarClick}
              className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 cursor-pointer group shadow-xl transition-all hover:border-cyan-400"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-slate-400 dark:text-slate-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
              
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                {isUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4">Change Photo</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
                Full Name
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
                Email <span className="text-[10px] text-slate-400 lowercase normal-case ml-2">(Read Only)</span>
              </label>
              <input 
                type="email" 
                value={currentUser.email}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-900/80 border border-transparent rounded-2xl px-5 py-4 text-slate-500 focus:outline-none cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
                Bio
              </label>
              <textarea 
                rows="4"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10">
            <button 
              type="submit" 
              disabled={isSaving || isUploading}
              className="w-full py-4 bg-cyan-500 text-slate-950 font-bold rounded-2xl hover:bg-cyan-400 transition-colors uppercase tracking-widest flex justify-center items-center shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:opacity-50"
            >
              {isSaving ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Saving...</> : <><Save className="w-5 h-5 mr-2" /> Save Profile</>}
            </button>
          </div>

        </form>

        {/* Mobile Sign Out */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 md:hidden flex justify-center">
          <button onClick={handleSignOut} className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 font-medium hover:bg-rose-500/20 transition-all w-full justify-center">
            <LogOut size={18} /> Sign Out
          </button>
        </div>

      </div>

    </div>
  );
};

export default ProfileView;
