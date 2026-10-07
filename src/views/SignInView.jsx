import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Loader2, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';

const GoogleMark = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const SignInView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { reportBackendError, startDemo, isDemo } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!auth) throw new Error('Authentication is not configured. Add your Firebase keys to .env.');
      await signInWithEmailAndPassword(auth, email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error(err);
      setError(reportBackendError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (!auth) throw new Error('Authentication is not configured. Add your Firebase keys to .env.');
      await signInWithPopup(auth, googleProvider);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error(err);
      setError(reportBackendError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setIsLoading(true);
    try {
      await startDemo(role);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message ?? 'Could not start the demo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 pb-16">
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-aqua-500/30 w-full max-w-md p-8 rounded-panel relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aqua-400 to-transparent opacity-50" />

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Sign in to VoxCampus</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">Pick up where you left off.</p>

        {error && (
          <div
            role="alert"
            className="bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-xs font-semibold text-center"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label
              htmlFor="signin-email"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Email
            </label>
            <input
              id="signin-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-aqua-400 focus:ring-1 focus:ring-aqua-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="user@voxcampus.edu"
            />
          </div>

          <div>
            <label
              htmlFor="signin-password"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signin-password"
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 pr-16 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-aqua-400 focus:ring-1 focus:ring-aqua-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-aqua-500 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 rounded-xl font-bold text-sm bg-aqua-500 hover:bg-aqua-400 text-slate-950 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs font-semibold">Or</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || !isFirebaseConfigured}
          title={isFirebaseConfigured ? undefined : 'Add Firebase keys to enable Google sign-in'}
          className="w-full py-4 rounded-xl font-bold text-sm bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 transition-colors flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleMark />
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-aqua-600 dark:text-aqua-400 hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-6 bg-slate-50 dark:bg-slate-950/50 border hairline rounded-card p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 text-center">
            {isDemo ? 'You are in the demo' : 'No account? Try the demo'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDemo('student')}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl border border-aqua-500/40 text-aqua-600 dark:text-aqua-400 text-sm font-semibold hover:bg-aqua-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Student
            </button>
            <button
              type="button"
              onClick={() => handleDemo('instructor')}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl border border-[#E916E6]/40 text-[#E916E6] text-sm font-semibold hover:bg-[#E916E6]/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Instructor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
