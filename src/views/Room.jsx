import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, Copy, Users, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Room = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { liveRooms, currentUser } = useAppContext();
  
  const [status, setStatus] = useState('waiting'); // waiting, active
  const [isMuted, setIsMuted] = useState(true);
  
  const room = liveRooms.find(r => r.id === id);

  useEffect(() => {
    // Simulate waiting room validation
    const timer = setTimeout(() => {
      setStatus('active');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!room) return <div className="p-6 text-center text-white">Room not found</div>;

  const mockParticipants = [
    { id: 1, initial: 'A', name: 'Mr. Adebayo', host: true, talking: true },
    { id: 2, initial: 'O', name: 'Olawumi', host: false, talking: false },
    { id: 3, initial: 'J', name: 'James', host: false, talking: false },
    { id: 4, initial: 'S', name: 'Sarah', host: false, talking: false },
  ];

  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="glass p-8 rounded-[3rem] neon-border mb-8 animate-pulse">
          <Loader2 className="animate-spin text-cyan-400" size={64} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Validating Access...</h2>
        <p className="text-slate-400">Verifying your {currentUser.dept} • {currentUser.level} credentials.</p>
        
        <button 
          onClick={() => navigate(-1)}
          className="mt-12 text-slate-500 hover:text-white font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative">
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-gradient-to-b from-slate-900/80 to-transparent">
        <div>
          <h1 className="text-xl font-bold text-white">{room.title}</h1>
          <div className="flex items-center text-xs text-cyan-400 font-semibold mt-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-2"></div>
            LIVE
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="p-2 glass rounded-xl text-slate-300 hover:text-white"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Invite link copied!");
            }}
          >
            <Copy size={20} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-4 content-start overflow-y-auto pb-32">
        {mockParticipants.map((p, i) => (
          <div key={i} className="aspect-square glass rounded-3xl relative overflow-hidden flex flex-col items-center justify-center group">
            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${p.talking ? 'from-cyan-500/20 to-blue-500/20 opacity-100' : 'from-slate-800/50 to-slate-900/50 opacity-50 group-hover:opacity-100'}`}></div>
            
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold z-10 transition-all duration-300 ${p.talking ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.6)] scale-110' : 'bg-slate-800 text-slate-400 border-2 border-slate-700'}`}>
              {p.initial}
            </div>
            
            {/* Name Badge */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md rounded-lg py-1.5 px-2 flex justify-between items-center border border-slate-800/50 z-10">
              <span className="text-xs font-semibold text-white truncate pr-2">{p.name}</span>
              {!p.talking ? <MicOff size={12} className="text-red-400 shrink-0" /> : <Mic size={12} className="text-cyan-400 shrink-0" />}
            </div>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="fixed bottom-0 w-full md:w-[calc(100%-250px)] p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-50">
        <div className="glass rounded-3xl p-4 flex justify-between items-center border-slate-800/50 shadow-2xl">
          <button className="p-3 text-slate-400 hover:text-white bg-slate-800/50 rounded-2xl transition-colors">
            <Users size={24} />
          </button>
          
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-5 rounded-full transition-all duration-300 transform hover:scale-105 ${isMuted ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'neon-button'}`}
          >
            {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          <button 
            onClick={() => navigate('/')}
            className="p-3 text-white bg-red-500/80 hover:bg-red-500 rounded-2xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;
