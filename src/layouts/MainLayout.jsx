import { useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Headphones, Radio, User, LogOut, Sun, Moon, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { avatarDataUri } from '../lib/avatars';
import Logo from '../components/Logo';
import GuidedTour from '../components/GuidedTour';
import RoleSelectionModal from '../components/RoleSelectionModal';
import SessionTimeout from '../components/SessionTimeout';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, theme, toggleTheme, isDemo, startDemo, exitDemo } = useAppContext();

  // The live room is meant to be immersive: no sidebar, no bottom nav, and no
  // inactivity timer yanking the mic out from under someone mid-sentence.
  const isImmersive = location.pathname.startsWith('/room/');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const navItems = useMemo(
    () => [
      { icon: Home, label: 'Home', path: '/dashboard' },
      { icon: Headphones, label: 'Library', path: '/library' },
      { icon: Radio, label: 'Live', path: '/live' },
      { icon: User, label: 'Profile', path: '/profile' },
      { icon: Sparkles, label: 'AI Assistant', path: '/ai' },
    ],
    [],
  );

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname.startsWith('/course/')
      : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const needsRole = Boolean(currentUser) && !currentUser.role;

  if (isImmersive) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex overflow-hidden selection:bg-aqua-400/30 transition-colors duration-300">
      {needsRole ? (
        <RoleSelectionModal />
      ) : (
        <>
          {/* Skipped in demo mode: an inactivity logout would interrupt review. */}
          {!isDemo && <SessionTimeout />}
          <GuidedTour />

          {/* DESKTOP SIDEBAR (Hidden on mobile) */}
          <aside className="hidden md:flex flex-col w-64 material-chrome border-r border-slate-200/70 dark:border-white/[0.06] h-screen fixed top-0 left-0 z-50 transition-colors duration-300">
            {/* Branding */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-7 border-b hairline flex items-center group cursor-pointer transition-opacity duration-200 hover:opacity-80 text-left"
            >
              <Logo className="scale-[0.7] origin-left" />
            </button>

            {/* User Mini Profile */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 py-5 border-b hairline flex items-center gap-3 transition-colors duration-200 hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04] text-left"
            >
              <img
                src={currentUser?.avatarUrl || avatarDataUri(currentUser?.fullName || 'Student')}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-900/10 dark:ring-white/10"
              />
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser?.fullName || 'Student'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {currentUser?.role || 'No role set'}
                </p>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto custom-scrollbar">
              {navItems.map(({ icon: Icon, label, path }) => {
                const active = isActive(path);
                return (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-card text-sm font-medium transition-colors duration-200 ${
                      active
                        ? 'bg-aqua-500/12 text-aqua-600 dark:text-aqua-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.25 : 2} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t hairline flex flex-col gap-1.5 transition-colors duration-300">
              {isDemo && (
                <button
                  type="button"
                  onClick={() => startDemo(currentUser?.role === 'instructor' ? 'student' : 'instructor')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-aqua-500 text-slate-950 font-semibold text-sm rounded-card hover:bg-aqua-400 active:scale-[0.98] transition-all duration-200"
                >
                  <Sparkles size={16} />
                  <span>Switch to {currentUser?.role === 'instructor' ? 'Student' : 'Instructor'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-card text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-200"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-card text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors duration-200"
              >
                <LogOut size={16} />
                <span>{isDemo ? 'Leave Demo' : 'Sign Out'}</span>
              </button>
              {isDemo && (
                <button
                  type="button"
                  onClick={exitDemo}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors py-1"
                >
                  Exit demo &amp; sign in
                </button>
              )}
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="w-full flex-1 h-screen overflow-y-auto md:ml-64 relative custom-scrollbar pb-24 md:pb-0">
            <Outlet />
          </main>

          {/* MOBILE BOTTOM NAVIGATION (Hidden on desktop) */}
          <nav className="md:hidden fixed bottom-0 left-0 w-full material-chrome border-t hairline px-2 py-2 flex justify-between items-center z-50 pb-safe transition-colors duration-300">
            {navItems.map(({ icon: Icon, label, path }) => {
              const active = isActive(path);
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-1 flex-col items-center gap-1 py-1.5 rounded-card transition-colors duration-200 ${
                    active ? 'text-aqua-600 dark:text-aqua-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.25 : 2} />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              );
            })}
            {/* Mobile Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex flex-1 flex-col items-center gap-1 py-1.5 rounded-card transition-colors duration-200 text-slate-500 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              <span className="text-[11px] font-medium">Theme</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
};

export default MainLayout;
