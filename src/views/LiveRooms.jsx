import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Users, PlusCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const LiveRooms = () => {
  const { liveRooms, currentUser } = useAppContext();
  const navigate = useNavigate();

  const myRooms = liveRooms.filter(r => r.dept === currentUser.dept);

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">Live Rooms</h1>
          <p className="text-slate-400 text-sm md:text-base mt-1">Join interactive audio classes</p>
        </div>
        {currentUser.role === 'instructor' && (
          <button className="bg-cyan-950/50 border border-cyan-500/50 text-cyan-400 p-3 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:bg-cyan-900/50 hover:scale-110 transition-all duration-300">
            <PlusCircle size={28} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {myRooms.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center text-slate-500 col-span-full">
            <Mic className="mx-auto mb-4 opacity-50" size={64} />
            <p className="text-lg">No active rooms in your department right now.</p>
          </div>
        ) : (
          myRooms.map(room => (
            <div 
              key={room.id} 
              onClick={() => navigate(`/room/${room.id}`)}
              className="glass p-6 rounded-3xl flex justify-between items-center cursor-pointer hover:neon-border transition-all duration-300 relative overflow-hidden group hover:scale-105 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
              
              <div className="flex items-center pl-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mr-5 group-hover:bg-red-500/30 transition-colors">
                    <Mic size={28} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-xl leading-tight group-hover:text-cyan-300 transition-colors">{room.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">Host: <span className="font-medium text-slate-300">{room.host}</span></p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center text-xs font-semibold text-white border border-slate-700 shadow-inner">
                  <Users size={16} className="mr-1.5 text-cyan-400" /> 24
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveRooms;
