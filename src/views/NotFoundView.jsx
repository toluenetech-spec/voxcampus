import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Logo from '../components/Logo';

const NotFoundView = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 text-center transition-colors duration-300">
    <div className="mb-10">
      <Logo />
    </div>
    <div className="w-16 h-16 rounded-card bg-aqua-500/10 border border-aqua-500/30 flex items-center justify-center mx-auto mb-6">
      <Compass className="w-8 h-8 text-aqua-500 dark:text-aqua-400" />
    </div>
    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
      Page not found
    </h1>
    <p className="text-slate-600 dark:text-slate-400 max-w-md mb-10 leading-relaxed">
      That link does not lead anywhere. Head back to your dashboard or explore the global library.
    </p>
    <div className="flex flex-col sm:flex-row gap-4">
      <Link
        to="/dashboard"
        className="px-8 py-4 rounded-full bg-aqua-500 text-slate-950 font-semibold text-sm hover:bg-aqua-400 transition-colors shadow-contact"
      >
        Go to dashboard
      </Link>
      <Link
        to="/"
        className="px-8 py-4 rounded-full border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
      >
        Visit homepage
      </Link>
    </div>
  </div>
);

export default NotFoundView;
