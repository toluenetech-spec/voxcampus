import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Apply Theme on Mount & Change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Fallback login logic in case Firebase isn't fully connected during testing
  const fallbackLogin = (email, password, role, fullName, institution, level) => {
    setCurrentUser({
      uid: 'fallback-123',
      email,
      role,
      fullName,
      institution,
      level,
      joinedCourses: [],
      avatar: '',
      bio: ''
    });
  };

  useEffect(() => {
    // 1. Auth Persistence Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setCurrentUser({ uid: user.uid, email: user.email, ...userDoc.data() });
          } else {
            // Automatically create a Firestore document for new Google users
            const newUserData = {
              email: user.email,
              role: null, // Default role null so user must select
              fullName: user.displayName || 'Unknown User',
              avatarUrl: user.photoURL || '',
              bio: '',
              joinedCourses: [],
              institution: 'Global',
              level: 1
            };
            
            await setDoc(userDocRef, newUserData);
            setCurrentUser({ uid: user.uid, ...newUserData });
          }
        } catch (error) {
          console.error("Error fetching/creating user data:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    });

    // 2. Real-Time Courses Listener
    const unsubscribeCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);
    }, (error) => {
      console.error("Error fetching courses snapshot:", error);
    });

    // Cleanup listeners
    return () => {
      unsubscribeAuth();
      unsubscribeCourses();
    };
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    fallbackLogin,
    logout,
    courses,
    theme,
    toggleTheme,
    // fetchData is deprecated but kept to prevent breaking other components temporarily
    fetchData: async () => { console.warn("fetchData is deprecated. UI is now real-time."); }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-300">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-6" />
        <Logo className="scale-[0.8]" />
        <p className="text-cyan-500/50 text-sm mt-2">Authenticating Session...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
