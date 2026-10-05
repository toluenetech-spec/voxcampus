import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Logo from './components/Logo';

// Layouts
import MainLayout from './layouts/MainLayout';

// Views
import SignInView from './views/SignInView';
import SignUpView from './views/SignUpView';
import LandingView from './views/LandingView';
import Dashboard from './views/Dashboard';
import LibraryView from './views/LibraryView';
import LiveRoomsView from './views/LiveRoomsView';
import LiveRoomDetailView from './views/LiveRoomDetailView';
import CourseDetailView from './views/CourseDetailView';
import ProfileView from './views/ProfileView';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout for Authentication (No Navbars)
const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] dark:from-slate-900 dark:to-slate-950 transition-colors duration-300">
      <div className="pt-12 pb-4 flex flex-col items-center">
        <div className="mb-4">
          <Logo className="scale-125" />
        </div>
        <p className="text-slate-400 text-sm tracking-widest uppercase font-bold">Universal E-Learning</p>
      </div>
      <Outlet />
    </div>
  );
};

const AppContent = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingView />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<SignInView />} />
        <Route path="/signup" element={<SignUpView />} />
      </Route>

      {/* Main Secure Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/course/:id" element={<CourseDetailView />} />
        <Route path="/library" element={<LibraryView />} />
        <Route path="/live" element={<LiveRoomsView />} />
        {/* We use MainLayout for the Room too, but typically you might hide sidebars for full immersion. The layout handles it. */}
        <Route path="/room/:roomId" element={<LiveRoomDetailView />} />
        <Route path="/profile" element={<ProfileView />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
