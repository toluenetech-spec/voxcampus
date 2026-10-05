import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Headphones, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Podcasts = () => {
  const { podcasts, currentUser } = useAppContext();
  const navigate = useNavigate();

  const myPodcasts = podcasts;

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">Library</h1>
          <p className="text-slate-400 text-sm md:text-base mt-1">Audio Lectures</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search lectures..." 
            className="w-full glass border-slate-700/50 rounded-2xl py-3 pl-11 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)] focus:shadow-[0_0_15px_rgba(0,229,255,0.2)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {myPodcasts.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center text-slate-500 col-span-full">
            <Headphones className="mx-auto mb-4 opacity-50" size={64} />
            <p className="text-lg">No lectures available for your department yet.</p>
          </div>
        ) : (
          myPodcasts.map(podcast => (
            <div 
              key={podcast.id} 
              onClick={() => navigate(`/player/${podcast.id}`)}
              className="glass p-5 rounded-3xl flex items-center cursor-pointer hover:bg-slate-800/60 hover:neon-border hover:scale-105 transition-all duration-300 group shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-900 to-blue-900 flex items-center justify-center mr-5 shrink-0 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] transition-all duration-300">
                <Headphones className="text-cyan-400" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-100 text-lg truncate group-hover:text-cyan-300 transition-colors">{podcast.title}</h3>
                <p className="text-sm text-slate-400 truncate mt-1">{podcast.lecturer}</p>
                <div className="flex items-center mt-3 space-x-2">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-900/50">{podcast.duration}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{podcast.level}</span>
                </div>
              </div>
              <div className="pl-3">
                <PlayCircle className="text-slate-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300 drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" size={36} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Podcasts;
