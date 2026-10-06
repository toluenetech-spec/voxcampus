import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppProvider, useAppContext } from './context/AppContext'
import Logo from './components/Logo'
import BackendBanner from './components/BackendBanner'
import RouteFallback from './components/RouteFallback'

// Layouts
import MainLayout from './layouts/MainLayout'

// Views
import SignInView from './views/SignInView'
import SignUpView from './views/SignUpView'
import LandingView from './views/LandingView'
import Dashboard from './views/Dashboard'
import LibraryView from './views/LibraryView'
import LiveRoomsView from './views/LiveRoomsView'
import CourseDetailView from './views/CourseDetailView'
import ProfileView from './views/ProfileView'
import NotFoundView from './views/NotFoundView'

// The ZegoCloud live-audio SDK is ~5 MB. Loading it only when someone actually
// opens a room keeps the initial bundle an order of magnitude smaller.
const LiveRoomDetailView = lazy(() => import('./views/LiveRoomDetailView'))

const ProtectedRoute = () => {
  const { currentUser } = useAppContext()
  const location = useLocation()

  if (!currentUser) {
    // Remember where they were headed so sign-in can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

// Layout for Authentication (No Navbars)
const AuthLayout = () => {
  const { currentUser } = useAppContext()

  if (currentUser) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      <div className="pt-12 pb-4 flex flex-col items-center px-6">
        <div className="mb-4">
          <Logo className="scale-110 md:scale-125" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm tracking-widest uppercase font-bold">
          Universal E-Learning
        </p>
      </div>
      <Outlet />
    </div>
  )
}

const AppContent = () => {
  return (
    <>
      <BackendBanner />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingView />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<SignInView />} />
            <Route path="/signup" element={<SignUpView />} />
          </Route>

          {/* Main Secure Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/course/:id" element={<CourseDetailView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/live" element={<LiveRoomsView />} />
              {/* MainLayout intentionally keeps its chrome out of the room view. */}
              <Route path="/room/:roomId" element={<LiveRoomDetailView />} />
              <Route path="/profile" element={<ProfileView />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </Suspense>
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  )
}

export default App
