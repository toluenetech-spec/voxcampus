import { CloudOff, X } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Non-blocking notice shown when the backend cannot be reached, or when the
 * user is exploring the built-in demo workspace.
 */
const BackendBanner = () => {
  const { backendStatus, backendError, isDemo } = useAppContext();
  const [dismissed, setDismissed] = useState(false);

  if (isDemo) {
    return (
      <div className="relative z-[300] bg-aqua-500/12 border-b border-aqua-400/25 text-aqua-700 dark:text-aqua-300 text-center px-12 py-2 text-xs font-medium">
        Demo workspace — data is local to this browser and resets from Profile
      </div>
    );
  }

  if (backendStatus !== 'unreachable' || dismissed || !backendError) return null;

  return (
    <div className="relative z-[300] bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-2.5 text-center text-xs font-medium flex items-center justify-center gap-3">
      <CloudOff className="w-4 h-4 shrink-0" />
      <span>{backendError}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-900/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default BackendBanner;
