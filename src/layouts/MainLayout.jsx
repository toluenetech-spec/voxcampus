import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Headphones, Radio, User, LogOut, Hexagon, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Logo from '../components/Logo';
import GuidedTour from '../components/GuidedTour';
import RoleSelectionModal from '../components/RoleSelectionModal';
import SessionTimeout from '../components/SessionTimeout';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser, currentUser, theme, toggleTheme } = useAppContext();
  const [userProfile, setUserProfile] = React.useState(currentUser);

  React.useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile({ uid: currentUser.uid, email: currentUser.email, ...docSnap.data() });
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { icon: <Home size={24} />, label: 'Home', path: '/dashboard' },
    { icon: <Headphones size={24} />, label: 'Library', path: '/library' },
    { icon: <Radio size={24} />, label: 'Live', path: '/live' },
    { icon: <User size={24} />, label: 'Profile', path: '/profile' }
  ];

  return (
    // Global Premium Aura Background (Supports Light & Dark)
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 text-slate-900 dark:text-white flex overflow-hidden selection:bg-cyan-500/30 transition-colors duration-300">

      {(userProfile && (!userProfile.role || userProfile.role === '')) ? (
        <RoleSelectionModal />
      ) : (
        <>
          <GuidedTour />
          <SessionTimeout />

          {/* DESKTOP SIDEBAR (Hidden on mobile) */}
          <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200 dark:border-white/5 h-screen fixed top-0 left-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-colors duration-300">

            {/* Branding */}
            <div className="p-8 border-b border-slate-200 dark:border-white/5 flex items-center space-x-3 group cursor-pointer transition-colors duration-300">
              <div>
                <Logo className="scale-[0.7] origin-left" />
              </div>
            </div>

            {/* User Mini Profile */}
            <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center space-x-4 transition-colors duration-300">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <User size={20} className="text-slate-300" />
                </div>
              )}
              <div className="truncate">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Logged in as</p>
                <p className="font-bold text-slate-900 dark:text-slate-200 truncate">{userProfile?.fullName || 'Student'}</p>
                <p className="text-[11px] text-cyan-600 dark:text-cyan-500/80 capitalize font-medium">{userProfile?.role}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${isActive
                        ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-2 border-cyan-500 dark:border-cyan-400 shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border-l-2 border-transparent'
                      }`}
                  >
                    <div className={`${isActive ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : ''}`}>
                      {item.icon}
                    </div>
                    <span className="tracking-wide">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 flex flex-col space-y-2 transition-colors duration-300">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-bold text-sm tracking-wide">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-300 transition-colors border border-red-200 dark:border-red-500/20"
              >
                <LogOut size={20} />
                <span className="font-bold text-sm tracking-wide">Sign Out</span>
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="w-full flex-1 h-screen overflow-y-auto md:ml-64 relative custom-scrollbar pb-24 md:pb-0">
            <Outlet />
          </main>

          {/* MOBILE BOTTOM NAVIGATION (Hidden on desktop) */}
          <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)] pb-safe transition-colors duration-300">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-cyan-500 dark:text-cyan-400 scale-110 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                >
                  {item.icon}
                  <span className={`text-[10px] font-bold tracking-wider mt-1.5 transition-all ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex flex-col items-center p-2 rounded-xl transition-all duration-300 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            >
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              <span className="text-[10px] font-bold tracking-wider mt-1.5 opacity-0 h-0 overflow-hidden">
                Theme
              </span>
            </button>
          </nav>

        </>
      )}
    </div>
  );
};

export default MainLayout;
