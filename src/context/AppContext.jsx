/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import * as store from '../services/store';
import { localDb } from '../lib/localDb';
import { buildDemoSeed, DEMO_ACCOUNTS } from '../lib/demoSeed';
import { Loader2, CloudOff } from 'lucide-react';
import Logo from '../components/Logo';

const AppContext = createContext(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used inside <AppProvider>');
  return context;
};

const THEME_KEY = 'voxcampus_theme';
const MODE_KEY = 'voxcampus_mode';
const DEMO_USER_KEY = 'voxcampus_demo_user';

// If Firebase Auth never reports back, stop blocking the UI and say so.
const AUTH_TIMEOUT_MS = 12000;

const CONFIG_ERROR = 'Firebase is not configured. Copy .env.example to .env and add your project keys.';

const preferredTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const readStoredDemoUser = () => {
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.uid ? { uid: parsed.uid, role: parsed.role ?? null } : null;
  } catch {
    return null;
  }
};

const friendlyAuthError = (error) => {
  const code = error?.code ?? '';
  if (code === 'auth/network-request-failed') return 'Cannot reach the authentication service. Check your connection.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
  if (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials'
  )
    return 'That email and password combination is incorrect.';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/email-already-in-use') return 'That email is already registered. Try signing in instead.';
  if (code === 'auth/weak-password') return 'Passwords must be at least 6 characters.';
  if (code === 'auth/popup-closed-by-user') return 'The Google sign-in window was closed before finishing.';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the Google pop-up. Allow pop-ups and try again.';
  if (code === 'auth/cancelled-popup-request') return 'The Google sign-in request was cancelled.';
  if (code === 'auth/operation-not-allowed') return 'That sign-in method is not enabled for this project yet.';
  // Thrown when the deployment's domain is missing from Firebase Console →
  // Authentication → Settings → Authorized domains. Very common right after
  // deploying to a host like Vercel, and otherwise a cryptic failure.
  if (code === 'auth/unauthorized-domain')
    return `This domain (${window.location.hostname}) is not authorised for sign-in. Add it under Firebase Console → Authentication → Settings → Authorized domains.`;
  return error?.message ?? 'Something went wrong. Please try again.';
};

export const AppProvider = ({ children }) => {
  const [mode, setMode] = useState(() => (localStorage.getItem(MODE_KEY) === 'demo' ? 'demo' : 'cloud'));
  const [demoUser, setDemoUser] = useState(readStoredDemoUser);
  const [authUser, setAuthUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [connectionState, setConnectionState] = useState('connecting'); // connecting | online | unreachable
  const [connectionError, setConnectionError] = useState('');
  const [theme, setTheme] = useState(preferredTheme);

  // Cloud path: only the auth listener can resolve the session, so block until
  // it reports (or the timeout fires). Demo path: block until the seeded
  // profile snapshot lands, otherwise a deep link like /library would flash
  // through ProtectedRoute and bounce the user back to the dashboard.
  const [authResolved, setAuthResolved] = useState(!isFirebaseConfigured);

  const isDemo = mode === 'demo';
  const seededRef = useRef(false);
  const activeUid = currentUser?.uid ?? null;
  const loadingAuth = isDemo ? Boolean(demoUser) && !activeUid : !authResolved;

  const clearDemoSession = useCallback(() => {
    try {
      localStorage.removeItem(DEMO_USER_KEY);
    } catch {
      /* ignore */
    }
    setDemoUser(null);
    setCurrentUser(null);
    setCourses([]);
  }, []);

  /* ---------------------------------------------------------------- *
   * Theme
   * ---------------------------------------------------------------- */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  /* ---------------------------------------------------------------- *
   * Backend selection + demo seeding (side effects only — no setState)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    store.setBackend(isDemo);
    if (!isDemo) {
      seededRef.current = false;
      return;
    }
    if (!seededRef.current) {
      localDb.seed(buildDemoSeed());
      seededRef.current = true;
    }
  }, [isDemo]);

  /* ---------------------------------------------------------------- *
   * Firebase auth listener
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (isDemo) return undefined;

    if (!auth) {
      // Nothing to wait for: surface the misconfiguration and let the app render.
      const timer = setTimeout(() => {
        setConnectionState('unreachable');
        setConnectionError(CONFIG_ERROR);
        setAuthResolved(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      setConnectionState('unreachable');
      setConnectionError('Could not reach Firebase. You can retry, or explore the built-in demo.');
      setAuthResolved(true);
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        settled = true;
        clearTimeout(timer);
        setAuthUser(user);
        if (!user) setCurrentUser(null);
        setConnectionState('online');
        setConnectionError('');
        setAuthResolved(true);
      },
      (error) => {
        settled = true;
        clearTimeout(timer);
        console.error('Auth listener error:', error);
        setConnectionState('unreachable');
        setConnectionError(friendlyAuthError(error));
        setAuthResolved(true);
      },
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [isDemo]);

  /* ---------------------------------------------------------------- *
   * Live user profile (keeps role / enrolments / name in sync everywhere)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const uid = isDemo ? demoUser?.uid : authUser?.uid;
    if (!uid) return undefined;

    const userRef = store.doc(store.db, 'users', uid);

    const unsubscribe = store.onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setCurrentUser((prev) => ({
            ...prev,
            ...snap.data(),
            uid,
            email: snap.data()?.email ?? prev?.email ?? authUser?.email ?? '',
          }));
          return;
        }

        if (isDemo) {
          // Stale demo session (for example after a data reset): drop it rather
          // than leaving the app waiting on a profile that will never arrive.
          clearDemoSession();
          return;
        }

        // First sign-in (Google, or an account created before the profile write
        // landed): create the document so the role modal can take over.
        const profile = {
          email: authUser?.email ?? '',
          role: null,
          fullName: authUser?.displayName || (authUser?.email ? authUser.email.split('@')[0] : 'New User'),
          avatarUrl: authUser?.photoURL || '',
          bio: '',
          institution: '',
          level: '',
          joinedCourses: [],
          createdAt: store.serverTimestamp(),
        };
        store.setDoc(userRef, profile, { merge: true }).catch((error) => {
          console.error('Could not create the user profile:', error);
          setCurrentUser({ uid, ...profile, createdAt: undefined });
        });
      },
      (error) => {
        console.error('User profile listener error:', error);
        if (!isDemo) {
          setConnectionState('unreachable');
          setConnectionError('Live profile data is unavailable right now.');
        }
      },
    );

    return unsubscribe;
  }, [isDemo, authUser, demoUser?.uid, clearDemoSession]);

  /* ---------------------------------------------------------------- *
   * Courses (real-time)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!activeUid) return undefined;

    const unsubscribe = store.onSnapshot(
      store.collection(store.db, 'courses'),
      (snapshot) => {
        setCourses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error('Courses listener error:', error);
        if (!isDemo) {
          setConnectionState('unreachable');
          setConnectionError('Live course data is unavailable right now.');
        }
      },
    );

    return unsubscribe;
  }, [activeUid, isDemo]);

  /* ---------------------------------------------------------------- *
   * Derived backend status
   * ---------------------------------------------------------------- */
  const backendStatus = isDemo ? 'demo' : connectionState;
  const backendError = isDemo ? '' : !isFirebaseConfigured ? CONFIG_ERROR : connectionError;

  /* ---------------------------------------------------------------- *
   * Actions
   * ---------------------------------------------------------------- */

  const persistDemoUser = useCallback((user) => {
    try {
      // Only the identity is persisted; profile fields come from the store so a
      // reload can never resurrect stale data.
      if (user?.uid) localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ uid: user.uid, role: user.role ?? null }));
      else localStorage.removeItem(DEMO_USER_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * Optimistic local-only update. Callers remain responsible for writing to the
   * store (e.g. `updateDoc`) — this just keeps the UI in step without waiting
   * for the snapshot to come back.
   */
  const patchUser = useCallback((patch) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const startDemo = useCallback(
    async (role = 'student') => {
      localStorage.setItem(MODE_KEY, 'demo');
      localDb.reset();
      store.setBackend(true);
      localDb.seed(buildDemoSeed());
      seededRef.current = true;

      const account = { ...(DEMO_ACCOUNTS[role] ?? DEMO_ACCOUNTS.student) };
      persistDemoUser(account);
      setDemoUser({ uid: account.uid, role: account.role });
      setCurrentUser(account);
      setMode('demo');

      // Drop any real session so the two worlds never mix.
      if (auth) await signOut(auth).catch(() => {});
    },
    [persistDemoUser],
  );

  const exitDemo = useCallback(() => {
    localStorage.removeItem(MODE_KEY);
    persistDemoUser(null);
    localDb.reset();
    store.setBackend(false);
    setDemoUser(null);
    setCurrentUser(null);
    setCourses([]);
    setMode('cloud');
    setAuthResolved(!isFirebaseConfigured);
  }, [persistDemoUser]);

  const resetDemoData = useCallback(() => {
    localDb.reset();
    localDb.seed(buildDemoSeed());
  }, []);

  const logout = useCallback(async () => {
    if (isDemo) {
      exitDemo();
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setCurrentUser(null);
      setAuthUser(null);
      setCourses([]);
    }
  }, [isDemo, exitDemo]);

  const reportBackendError = useCallback((error) => {
    const message = friendlyAuthError(error);
    setConnectionError(message);
    if (error?.code === 'auth/network-request-failed') setConnectionState('unreachable');
    return message;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      patchUser,
      courses,
      theme,
      toggleTheme,
      logout,
      loadingAuth,
      backendStatus,
      backendError,
      reportBackendError,
      isBackendReachable: backendStatus === 'online' || backendStatus === 'demo',
      isDemo,
      startDemo,
      exitDemo,
      resetDemoData,
      isFirebaseConfigured,
    }),
    [
      currentUser,
      patchUser,
      courses,
      theme,
      toggleTheme,
      logout,
      loadingAuth,
      backendStatus,
      backendError,
      reportBackendError,
      isDemo,
      startDemo,
      exitDemo,
      resetDemoData,
    ],
  );

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 text-center transition-colors duration-300">
        <Loader2 className="w-12 h-12 text-aqua-500 animate-spin mb-6" />
        <Logo className="scale-[0.8]" />
        <p className="text-aqua-600/70 dark:text-aqua-500/50 text-sm mt-2 font-semibold tracking-wide">
          Restoring your session…
        </p>
      </div>
    );
  }

  // Only a genuinely unconfigured project is a hard stop; a merely unreachable
  // backend still renders the marketing site so the landing page stays usable.
  if (!isFirebaseConfigured && !currentUser && !isDemo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 text-center transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-panel p-10 shadow-xl">
          <CloudOff className="w-14 h-14 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">VoxCampus is not connected</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">{backendError}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 py-3 rounded-card bg-aqua-500 text-slate-950 font-semibold text-sm hover:bg-aqua-400 active:scale-[0.98] transition-all"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => startDemo('student')}
              className="flex-1 py-3 rounded-card border border-aqua-400/40 text-aqua-600 dark:text-aqua-400 font-semibold text-sm hover:bg-aqua-500/10 transition-colors"
            >
              Explore demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;
