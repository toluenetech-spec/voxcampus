import React, { useState, useEffect } from 'react';

const steps = [
  { 
    title: 'Welcome to your Dashboard', 
    content: 'This is your home base. Use the sidebar to quickly jump back into your recent lectures, manage your enrolled courses, or view your learning stats.' 
  },
  { 
    title: 'Global Library', 
    content: 'Click the Library tab to explore the platform. You can use the search bar to find specific subjects or browse trending academic podcasts.' 
  },
  { 
    title: 'Live Rooms', 
    content: 'Tap the Live icon to see currently active study groups. If you are an instructor, you can start hosting your own virtual office hours.' 
  }
];

const GuidedTour = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('voxcampus_tour_done');
    if (!tourCompleted) {
      // Small delay to let the dashboard load first
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      closeTour();
    }
  };

  const closeTour = () => {
    localStorage.setItem('voxcampus_tour_done', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] rounded-2xl p-8 max-w-md w-full relative animate-in fade-in zoom-in duration-300">
        
        {/* Step Indicator */}
        <div className="text-cyan-400 text-sm font-bold tracking-wider uppercase mb-4">
          Step {currentStep + 1} of {steps.length}
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-white mb-3">
          {steps[currentStep].title}
        </h3>
        <p className="text-slate-300 leading-relaxed mb-8">
          {steps[currentStep].content}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 pt-6 border-t border-slate-800">
          <button 
            onClick={closeTour}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Skip Tour
          </button>
          
          <button 
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