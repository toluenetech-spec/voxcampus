import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Bell, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Profile = () => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-6 pb-24 min-h-screen">
      <h1 className="text-2xl font-bold text-white tracking-wide mb-8">Profile</h1>
      
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-cyan-500/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
          <User size={40} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
        <p className="text-sm text-cyan-400 font-medium mt-1 uppercase tracking-wider">{currentUser.role}</p>
      </div>

      <div className="glass rounded-3xl overflow-hidden mb-6 border-slate-800/50">
        <div className="p-4 border-b border-slate-800/50 flex justify-between">
          <span className="text-slate-400 text-sm">Department</span>
          <span className="text-slate-200 font-medium text-sm">{currentUser.dept}</span>
        </div>
        <div className="p-4 flex justify-between">
          <span className="text-slate-400 text-sm">Level</span>
          <span className="text-slate-200 font-medium text-sm">{currentUser.level}</span>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden mb-8 border-slate-800/50">
        <button className="w-full p-4 border-b border-slate-800/50 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center text-slate-300">
            <Settings size={20} className="mr-3 text-slate-400" />
            <span className="text-sm font-medium">Account Settings</span>
          </div>
          <ChevronRight size={18} className="text-slate-500" />
        </button>
        <button className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center text-slate-300">
            <Bell size={20} className="mr-3 text-slate-400" />
            <span className="text-sm font-medium">Notifications</span>
          </div>
          <ChevronRight size={18} className="text-slate-500" />
        </button>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full glass p-4 rounded-2xl flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all border-slate-800/50 font-bold"
      >
        <LogOut size={20} className="mr-2" />
        Sign Out
      </button>
    </div>
  );
};

export default Profile;
