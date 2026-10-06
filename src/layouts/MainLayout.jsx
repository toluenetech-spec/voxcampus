import { useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Headphones, Radio, User, LogOut, Sun, Moon, Sparkles } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { avatarDataUri } from '../lib/avatars'
import Logo from '../components/Logo'
import GuidedTour from '../components/GuidedTour'
import RoleSelectionModal from '../components/RoleSelectionModal'
import SessionTimeout from '../components/SessionTimeout'

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout, theme, toggleTheme, isDemo, startDemo, exitDemo } = useAppContext()

  // The live room is meant to be immersive: no sidebar, no bottom nav, and no
  // inactivity timer yanking the mic out from under someone mid-sentence.
  const isImmersive = location.pathname.startsWith('/room/')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const navItems = useMemo(
    () => [
      { icon: Home, label: 'Home', path: '/dashboard' },
      { icon: Headphones, label: 'Library', path: '/library' },
      { icon: Radio, label: 'Live', path: '/live' },
      { icon: User, label: 'Profile', path: '/profile' },
    ],
    [],
  )

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname.startsWith('/course/')
      : location.pathname.startsWith(path)

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const needsRole = Boolean(currentUser) && !currentUser.role

  if (isImmersive) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 text-slate-900 dark:text-white flex overflow-hidden selection:bg-cyan-500/30 transition-colors duration-300">
      {needsRole ? (
        <RoleSelectionModal />
      ) : (
        <>
          {/* Skipped in demo mode: an inactivity logout would interrupt review. */}
          {!isDemo && <SessionTimeout />}
          <GuidedTour />

          {/* DESKTOP SIDEBAR (Hidden on mobile) */}
          <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200 dark:border-white/5 h-screen fixed top-0 left-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-colors duration-300">
            {/* Branding */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-8 border-b border-slate-200 dark:border-white/5 flex items-center group cursor-pointer transition-colors duration-300 text-left"
            >
              <Logo className="scale-[0.7] origin-left" />
            </button>

            {/* User Mini Profile */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center space-x-4 transition-colors duration-300 hover:bg-slate-100 dark:hover:bg-white/5 text-left"
            >
              <img
                src={currentUser?.avatarUrl || avatarDataUri(currentUser?.fullName || 'Student')}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10"
              />
              <div className="truncate">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Logged in as</p>
                <p className="font-bold text-slate-900 dark:text-slate-200 truncate">
                  {currentUser?.fullName || 'Student'}
                </p>
                <p className="text-[11px] text-cyan-600 dark:text-cyan-500/80 capitalize font-medium">
                  {currentUser?.role || 'No role set'}
                </p>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
              {navItems.map(({ icon: Icon, label, path }) => {
                const active = isActive(path)
                return (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                      active
                        ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-2 border-cyan-500 dark:border-cyan-400 shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                  >
                    <span className={active ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : ''}>
                      <Icon size={24} />
                    </span>
                    <span className="tracking-wide">{label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 flex flex-col space-y-2 transition-colors duration-300">
              {isDemo && (
                <button
                  type="button"
                  onClick={() => startDemo(currentUser?.role === 'instructor' ? 'student' : 'instructor')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#1F6AE1] to-[#E916E6] text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={18} />
                  <span className="font-bold text-sm tracking-wide">
                    Switch to {currentUser?.role === 'instructor' ? 'Student' : 'Instructor'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-bold text-sm tracking-wide">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-300 transition-colors border border-red-200 dark:border-red-500/20"
              >
                <LogOut size={20} />
                <span className="font-bold text-sm tracking-wide">{isDemo ? 'Leave Demo' : 'Sign Out'}</span>
              </button>
              {isDemo && (
                <button
                  type="button"
                  onClick={exitDemo}
                  className="w-full text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1"
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
          <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)] pb-safe transition-colors duration-300">
            {navItems.map(({ icon: Icon, label, path }) => {
              const active = isActive(path)
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${
                    active
                      ? 'text-cyan-500 dark:text-cyan-400 scale-110 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={24} />
                  <span
                    className={`text-[10px] font-bold tracking-wider mt-1.5 transition-all ${
                      active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
            {/* Mobile Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex flex-col items-center p-2 rounded-xl transition-all duration-300 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            >
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              <span className="text-[10px] font-bold tracking-wider mt-1.5 opacity-0 h-0 overflow-hidden">Theme</span>
            </button>
          </nav>
        </>
      )}
    </div>
  )
}

export default MainLayout
