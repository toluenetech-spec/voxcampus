import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { auth, googleProvider } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

const SignInView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { fallbackLogin } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!auth) {
        fallbackLogin(email, password, 'student', 'Mock User', 'Universal', 'All Levels');
        try { navigate('/'); } catch { window.location.href = '/'; }
        return; 
      }

      await signInWithEmailAndPassword(auth, email, password);
      
      try {
        navigate('/');
      } catch {
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unknown error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-6">
      <div className="glass w-full max-w-md p-8 rounded-3xl neon-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
        
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In to VoxCampus</h2>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-4 text-xs font-semibold text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
              placeholder="user@voxcampus.edu"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Password</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-4 rounded-xl font-bold tracking-wider text-sm neon-button uppercase disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-semibold uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 rounded-xl font-bold tracking-wider text-sm bg-white text-slate-900 hover:bg-slate-200 transition-colors uppercase flex justify-center items-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

        <div className="mt-6 text-center">
          <Link to="/signup" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors font-medium">
            Don't have an account? Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
