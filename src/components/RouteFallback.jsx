import { Loader2 } from 'lucide-react'
import Logo from './Logo'

/** Full-page fallback for lazily-loaded routes (e.g. the live audio room). */
const RouteFallback = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 text-center transition-colors duration-300">
    <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-6" />
    <Logo className="scale-[0.7]" />
    <p className="text-cyan-600/70 dark:text-cyan-500/50 text-xs mt-3 font-semibold">
      Loading…
    </p>
  </div>
)

export default RouteFallback
