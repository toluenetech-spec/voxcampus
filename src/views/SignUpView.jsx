import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth'
import { Loader2 } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config'
import * as store from '../services/store'

const SignUpView = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student')
  const [institution, setInstitution] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { reportBackendError } = useAppContext()
  const navigate = useNavigate()

  const buildProfile = (userId, fallbackEmail) => ({
    uid: userId,
    fullName: fullName.trim() || (fallbackEmail ? fallbackEmail.split('@')[0] : 'New User'),
    email: fallbackEmail ?? '',
    role,
    institution: institution.trim(),
    level: role === 'instructor' ? 'Faculty' : '',
    bio: '',
    avatarUrl: '',
    joinedCourses: [],
    createdAt: store.serverTimestamp(),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!auth) throw new Error('Authentication is not configured. Add your Firebase keys to .env.')

      const credential = await createUserWithEmailAndPassword(auth, email, password)

      if (fullName.trim() && updateProfile) {
        await updateProfile(credential.user, { displayName: fullName.trim() }).catch(() => {})
      }

      // Write the profile before navigating so the dashboard never renders
      // without a role and flashes the role-selection modal.
      await store.setDoc(store.doc(store.db, 'users', credential.user.uid), buildProfile(credential.user.uid, email))

      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Sign up error:', err)
      setError(reportBackendError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    setIsLoading(true)
    try {
      if (!auth) throw new Error('Authentication is not configured. Add your Firebase keys to .env.')
      const credential = await signInWithPopup(auth, googleProvider)
      const profile = buildProfile(credential.user.uid, credential.user.email)
      profile.fullName = credential.user.displayName || profile.fullName
      profile.avatarUrl = credential.user.photoURL || ''
      await store.setDoc(store.doc(store.db, 'users', credential.user.uid), profile, { merge: true })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      setError(reportBackendError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 pb-16">
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.08)] w-full max-w-md p-8 rounded-3xl relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Create your account</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
          Start streaming lectures in under a minute.
        </p>

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
              htmlFor="signup-name"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide"
            >
              Full Name
            </label>
            <input
              id="signup-name"
              required
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="Ada Lovelace"
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide"
            >
              Email
            </label>
            <input
              id="signup-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="user@voxcampus.edu"
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                required
                minLength={6}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 pr-16 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-500 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-institution"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide"
            >
              Institution <span className="normal-case text-slate-400">(optional)</span>
            </label>
            <input
              id="signup-institution"
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="Bolmor Polytechnic"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
              I am a…
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'student', label: 'Student', hint: 'Listen & submit work' },
                { value: 'instructor', label: 'Instructor', hint: 'Host & publish' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === option.value
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500/50'
                  }`}
                >
                  <span
                    className={`block font-bold text-sm ${
                      role === option.value ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 rounded-xl font-bold tracking-wider text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors uppercase flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest">
            Or
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading || !isFirebaseConfigured}
          title={isFirebaseConfigured ? undefined : 'Add Firebase keys to enable Google sign-up'}
          className="w-full py-4 rounded-xl font-bold tracking-wider text-sm bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 transition-colors uppercase flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
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
          <span>Sign up with Google</span>
        </button>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUpView
