import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAppContext } from '../context/AppContext';
import { Lock } from 'lucide-react';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const SessionTimeout = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAppContext();
  const timerRef = useRef(null);
  const [isExpired, setIsExpired] = useState(false);

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('voxcampus_tour_done'); // Optional clear
      setIsExpired(true);
    } catch (error) {
      console.error("Error signing out due to inactivity:", error);
    }
  };

  const handleDismiss = () => {
    setIsExpired(false);
    navigate('/');
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Don't reset if already expired
    if (!isExpired) {
      timerRef.current = setTimeout(logoutUser, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Initialize first timer
    resetTimer();

    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isExpired]); // Re-bind or check if isExpired changes

  if (!isExpired) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-6 md:p-8 max-w-sm w-full relative animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="text-cyan-500 w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          Session Expired
        </h3>
        
        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
          For your security, you have been automatically logged out due to inactivity. 
        </p>
        
        <button 
          onClick={handleDismiss}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-all"
        >
          Log In Again
        </button>
      </div>
    </div>
  );
};

export default SessionTimeout;
