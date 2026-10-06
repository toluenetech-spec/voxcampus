import { useCallback, useEffect, useState } from 'react';

const TOUR_KEY = 'voxcampus_tour_done';

const steps = [
  {
    title: 'Welcome to your Dashboard',
    content:
      'This is your home base. Use the sidebar to jump back into your recent lectures, manage your enrolled courses, or view your learning stats.',
  },
  {
    title: 'Global Library',
    content:
      'Open the Library tab to explore the platform. Search for a subject, sort by what is trending, or preview a lecture before joining its course.',
  },
  {
    title: 'Live Rooms',
    content:
      'Tap the Live icon to see currently active study groups. If you are an instructor, you can start hosting your own virtual office hours.',
  },
];

const GuidedTour = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return undefined;
    // Small delay so the dashboard paints before the tour covers it.
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const closeTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true');
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (!isVisible) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isVisible, closeTour]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
    else closeTour();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-tour-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] rounded-2xl p-8 max-w-md w-full relative animate-in fade-in zoom-in-95 duration-300 transition-colors">
        <div className="text-cyan-600 dark:text-cyan-400 text-sm font-bold tracking-wider uppercase mb-4">
          Step {currentStep + 1} of {steps.length}
        </div>

        <h3 id="guided-tour-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          {steps[currentStep].title}
        </h3>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">{steps[currentStep].content}</p>

        <div className="flex items-center justify-between mt-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={closeTour}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Skip Tour
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-6 rounded-lg transition-all"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
