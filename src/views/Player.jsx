import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Volume2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { podcasts } = useAppContext();
  
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');

  const podcast = podcasts.find(p => p.id === id);

  useEffect(() => {
    return () => {
      // Cleanup speech synthesis when unmounting
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!podcast) {
    return <div className="p-6 text-center text-white">Podcast not found</div>;
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setProgress((curr / dur) * 100 || 0);
      setCurrentTime(formatTime(curr));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(formatTime(audioRef.current.duration));
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const skip = (amount) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  };

  const handleReadDescription = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(podcast.description);
      utterance.onend = () => setIsReading(false);
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Hidden audio element */}
      {podcast.audioUrl && (
        <audio 
          ref={audioRef} 
          src={podcast.audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header */}
      <div className="p-6 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="p-3 glass rounded-full text-slate-300 hover:text-white hover:border-cyan-400 transition-colors shadow-lg">
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Now Playing</span>
        <div className="w-12"></div> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 z-10 w-full max-w-lg mx-auto">
        
        {/* Album Art / Graphic */}
        <div className="w-64 h-64 md:w-80 md:h-80 glass rounded-[2.5rem] mb-10 flex items-center justify-center border-cyan-800/50 shadow-[0_0_40px_rgba(0,229,255,0.15)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20"></div>
          {/* Mock Waveform linked to play state */}
          <div className="flex items-end justify-center space-x-1.5 h-24 z-10 opacity-70">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`w-2.5 bg-cyan-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                style={{ height: `${isPlaying ? Math.max(20, Math.random() * 100) : 10}%` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="text-center mb-8 w-full px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight drop-shadow-md">{podcast.title}</h1>
          <p className="text-slate-400 font-medium md:text-lg">{podcast.lecturerName || podcast.lecturer}</p>
          <div className="mt-4 inline-block bg-slate-900 px-4 py-1.5 rounded-lg border border-slate-800 text-xs md:text-sm text-slate-400 shadow-inner">
            {podcast.dept} • {podcast.level}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-8">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3 shadow-inner">
            <div 
              className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.8)] relative transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-mono font-medium">
            <span>{currentTime}</span>
            <span>{podcast.audioUrl ? duration : podcast.duration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-8 mb-12">
          <button onClick={() => skip(-15)} className="text-slate-400 hover:text-white hover:scale-110 transition-all">
            <SkipBack size={32} />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-24 h-24 flex items-center justify-center rounded-full neon-button disabled:opacity-50"
            disabled={!podcast.audioUrl && podcast.id !== 'p1' && podcast.id !== 'p2'} // Fallback allowed for mock data
          >
            {isPlaying ? <Pause size={40} className="ml-1" /> : <Play size={40} className="ml-1" />}
          </button>
          
          <button onClick={() => skip(15)} className="text-slate-400 hover:text-white hover:scale-110 transition-all">
            <SkipForward size={32} />
          </button>
        </div>

        {/* TTS Description */}
        <div className="w-full glass p-6 rounded-3xl border-cyan-800/30 hover:border-cyan-400/50 transition-colors duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-200">About this lecture</h3>
            <button 
              onClick={handleReadDescription}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                isReading 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/80 shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                  : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)]'
              }`}
            >
              <Volume2 size={16} className={isReading ? 'animate-pulse' : ''} />
              <span>{isReading ? 'Stop Reading' : 'Read Out Loud'}</span>
            </button>
          </div>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            {podcast.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Player;
