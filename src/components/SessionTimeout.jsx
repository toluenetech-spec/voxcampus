import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Timer, Lock } from 'lucide-react';
import { auth } from '../firebase/config';
import { useAppContext } from '../context/AppContext';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_MS = 2 * 60 * 1000; // warn with 2 minutes to spare
const TICK_MS = 1000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

const SessionTimeout = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAppContext();

  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const lastActivityRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    lastActivityRef.current = Date.now();
    const markActivity = () => {
      lastActivityRef.current = Date.now();
      setSecondsLeft((prev) => (prev === null ? prev : null));
    };

    const logoutUser = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error signing out due to inactivity:', error);
      } finally {
        setCurrentUser(null);
        setSecondsLeft(null);
        setIsExpired(true);
      }
    };

    const interval = setInterval(() => {
      if (isExpired) return;
      const idleFor = Date.now() - lastActivityRef.current;
      const remaining = TIMEOUT_MS - idleFor;

      if (remaining <= 0) {
        logoutUser();
        return;
      }
      // Reading state through a ref-free comparison keeps the interval honest
      // even after several re-renders.
      setSecondsLeft(remaining <= WARNING_MS ? Math.ceil(remaining / TICK_MS) : null);
    }, TICK_MS);

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));

    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActivity));
    };
  }, [isExpired, setCurrentUser]);

  const handleStaySignedIn = () => {
    lastActivityRef.current = Date.now();
    setSecondsLeft(null);
  };

  const handleDismiss = () => {
    setIsExpired(false);
    navigate('/login', { replace: true });
  };

  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-card p-6 md:p-8 max-w-sm w-full relative animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center text-center transition-colors">
          <div className="w-16 h-16 bg-aqua-500/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="text-aqua-500 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Session Expired</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-sm">
            For your security, you were signed out after 30 minutes of inactivity.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full bg-aqua-500 hover:bg-aqua-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-all"
          >
            Log In Again
          </button>
        </div>
      </div>
    );
  }

  if (secondsLeft === null) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9998] w-[min(22rem,calc(100vw-3rem))]">
      <div
        role="alert"
        className="bg-white dark:bg-slate-900 border border-amber-500/40 shadow-2xl rounded-card p-5 animate-in fade-in slide-in-from-bottom-4 duration-300 transition-colors"
      >
        <div className="flex items-center gap-3 mb-2">
          <Timer className="w-5 h-5 text-amber-500 shrink-0" />
          <h3 className="font-bold text-slate-900 dark:text-white">Still there?</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          You will be signed out in{' '}
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{secondsLeft}s</span> of inactivity.
        </p>
        <button
          type="button"
          onClick={handleStaySignedIn}
          className="w-full py-2.5 rounded-xl bg-aqua-500 text-slate-950 font-bold text-xshover:bg-aqua-400 transition-colors"
        >
          I&apos;m still here
        </button>
      </div>
    </div>
  );
};

export default SessionTimeout;
