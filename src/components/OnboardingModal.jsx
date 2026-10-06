import React, { useState, useEffect } from 'react';
import { Compass, Mic, Upload, X } from 'lucide-react';

const OnboardingModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('voxcampus_tour_completed');
    if (!tourCompleted) {
      setIsVisible(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('voxcampus_tour_completed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Compass size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Welcome to VoxCampus</h2>
            <p className="text-slate-300 leading-relaxed">
              Explore the Global Library to discover trending academic podcasts and stream lectures on demand.
            </p>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#1F6AE1]/20 flex items-center justify-center text-[#1F6AE1] mb-6 shadow-[0_0_15px_rgba(31,106,225,0.3)]">
              <Mic size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Join Live Rooms</h2>
            <p className="text-slate-300 leading-relaxed">
              Jump into real-time audio rooms for study groups, office hours, and interactive Q&A sessions with instructors.
            </p>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#E916E6]/20 flex items-center justify-center text-[#E916E6] mb-6 shadow-[0_0_15px_rgba(233,22,230,0.3)]">
              <Upload size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Share Your Knowledge</h2>
            <p className="text-slate-300 leading-relaxed">
              Upload your own podcast episodes, manage your profile, and build your academic audience.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
      <div className="bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] p-8 max-w-lg w-full rounded-2xl relative">
        <button 
          onClick={handleComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close Tour"
        >
          <X size={24} />
        </button>
        
        <div className="min-h-[220px] flex flex-col justify-center">
          {renderContent()}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Progress Indicators */}
          <div className="flex gap-2">
            {[1, 2, 3].map((idx) => (
              <div 
                key={idx} 
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === idx ? 'bg-cyan-400 w-6' : 'bg-slate-600'}`}
              />
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-3 w-full sm:w-auto">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
              >
                Previous
              </button>
            )}
            
            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-colors font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#1F6AE1] hover:bg-blue-600 text-white transition-colors font-bold shadow-[0_0_20px_rgba(31,106,225,0.5)]"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
