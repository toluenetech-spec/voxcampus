import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Mic, Globe, BookOpen, Headphones, Sparkles, Database, Terminal, Code } from 'lucide-react';
import Logo from '../components/Logo';
import ParticleBackground from '../components/ParticleBackground';
import Footer from '../components/Footer';

const AnimatedCounter = ({ target, duration = 2000, suffix = "+" }) => {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);

  useEffect(() => {
    const node = counterRef.current;
    if (!node) return;

    let startTime;
    let animationFrame;
    let hasStarted = false;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(easeOut * target));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasStarted) {
          hasStarted = true;
          animationFrame = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (node) observer.unobserve(node);
    };
  }, [target, duration]);

  return (
    <span ref={counterRef}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const LandingView = () => {
  const { currentUser } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white relative flex flex-col font-sans">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      
      {/* Navbar (Minimal) */}
      <nav className="relative z-20 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <Logo className="scale-75 md:scale-100 origin-left" />
        <div className="space-x-4 flex items-center">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link to="/signup" className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white px-5 py-2 rounded-full transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex-grow flex flex-col items-center justify-center px-6 py-16 md:px-12 md:py-32 overflow-hidden">
        
        {/* Particle Animation Background */}
        <ParticleBackground />
        
        <div className="text-center max-w-5xl mx-auto w-full relative z-10">
          
          {/* Bouncing Icons Animation */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10 hidden md:flex">
            <div className="absolute top-10 left-10 animate-bounce [animation-duration:3s]">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-cyan-400">
                <Mic size={24} />
              </div>
            </div>
            <div className="absolute top-20 right-10 animate-bounce [animation-duration:4s] [animation-delay:1s]">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-[#E916E6]">
                <Headphones size={24} />
              </div>
            </div>
            <div className="absolute bottom-20 left-10 animate-bounce [animation-duration:3.5s] [animation-delay:0.5s]">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-[#1F6AE1]">
                <Sparkles size={24} />
              </div>
            </div>
            <div className="absolute bottom-10 right-20 animate-bounce [animation-duration:4.5s] [animation-delay:1.5s]">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-cyan-400">
                <Database size={24} />
              </div>
            </div>
            <div className="absolute top-1/2 -left-10 -translate-y-1/2 animate-bounce [animation-duration:3s] [animation-delay:2s]">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-[#E916E6]">
                <Terminal size={24} />
              </div>
            </div>
            <div className="absolute top-1/2 -right-10 -translate-y-1/2 animate-bounce [animation-duration:4s] [animation-delay:0.5s]">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-[#1F6AE1]">
                <Code size={24} />
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            The Future of <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-[#1F6AE1] to-[#E916E6]">
              Audio Learning.
            </span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed mt-6 mb-10 max-w-3xl mx-auto text-slate-300">
            Welcome to VoxCampus. Stream lectures, join live interactive audio rooms, and discover trending academic podcasts from top instructors.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
            <Link 
              to="/signup" 
              className="w-full sm:w-auto bg-[#1F6AE1] hover:bg-blue-600 text-white font-semibold text-lg md:text-xl py-4 px-10 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(31,106,225,0.4)] hover:shadow-[0_0_25px_rgba(31,106,225,0.6)] hover:scale-105"
            >
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto bg-transparent border border-slate-600 hover:border-slate-400 text-white font-semibold text-lg md:text-xl py-4 px-10 rounded-full transition-all duration-300 hover:bg-white/5"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 pb-12 relative z-10">
          
          <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 md:p-12 hover:-translate-y-2 hover:border-[#1F6AE1]/50 hover:bg-white/10 transition-all duration-300 flex flex-col items-start shadow-lg relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#1F6AE1] blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="bg-[#1F6AE1]/20 p-4 rounded-2xl mb-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300 relative z-10">
              <Mic size={32} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">Live Audio Rooms</h3>
            <p className="text-base text-slate-300 leading-relaxed relative z-10">
              Engage in real-time interaction during live broadcasts. Perfect for virtual office hours, study groups, and interactive Q&A sessions.
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 md:p-12 hover:-translate-y-2 hover:border-[#E916E6]/50 hover:bg-white/10 transition-all duration-300 flex flex-col items-start shadow-lg relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#E916E6] blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="bg-[#E916E6]/20 p-4 rounded-2xl mb-6 text-[#E916E6] group-hover:scale-110 transition-transform duration-300 relative z-10">
              <Globe size={32} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">Global Discovery Hub</h3>
            <p className="text-base text-slate-300 leading-relaxed relative z-10">
              Explore a Spotify-style trending algorithm that surfaces the most popular lectures and allows for instant, on-demand streaming.
            </p>
          </div>

          <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 md:p-12 hover:-translate-y-2 hover:border-cyan-400/50 hover:bg-white/10 transition-all duration-300 flex flex-col items-start shadow-lg relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-400 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="bg-cyan-400/20 p-4 rounded-2xl mb-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300 relative z-10">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">Instructor Podcasts</h3>
            <p className="text-base text-slate-300 leading-relaxed relative z-10">
              Access dedicated course materials seamlessly. Instructors can easily upload and manage their podcasts to build comprehensive audio libraries.
            </p>
          </div>

        </div>

      </main>

      {/* SPONSORS/PARTNERS SECTION */}
      <section className="w-full max-w-7xl mx-auto py-20 md:py-32 border-t border-white/10 text-center relative z-10 px-6">
        <p className="text-slate-400 font-semibold tracking-widest uppercase mb-12">Trusted by Top Institutions & Tech Academies</p>
        <div className="overflow-hidden w-full relative flex items-center [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex gap-16 md:gap-24 animate-[marquee_30s_linear_infinite] w-max py-4">
            
            {/* FIRST SET */}
            <span className="text-3xl md:text-5xl whitespace-nowrap flex-shrink-0 font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" style={{ animationDuration: '3s' }}>Google</span>
            <span className="text-3xl md:text-5xl whitespace-nowrap flex-shrink-0 font-bold tracking-tight text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse" style={{ animationDuration: '4s' }}>Gemini</span>
            <span className="text-3xl md:text-5xl whitespace-nowrap flex-shrink-0 font-bold tracking-tight text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-pulse" style={{ animationDuration: '3.5s' }}>Cloudinary</span>
            <span className="text-3xl md:text-5xl whitespace-nowrap flex-shrink-0 font-bold italic font-serif text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse" style={{ animationDuration: '4.5s' }}>3BF & Co.</span>
            <img src="/bolmor-logo.png" alt="Bolmor Polytechnic" className="h-16 md:h-24 object-contain flex-shrink-0 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-pulse" style={{ animationDuration: '3.2s' }} />
            <img src="/nacos-logo.png" alt="NACOS" className="h-16 md:h-24 object-contain flex-shrink-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse" style={{ animationDuration: '4.2s' }} />

            {/* SECOND SET */}
            <span className="text-3xl md:text-5xl whitespace-nowrap flex-shrink-0 font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" style={{ animationDuration: '3s' }}>Google</span>
            <span className="text-3xl md:text-5xl whitespace-nowrap flex-shrink-0 font-bold tracking-tight text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse" style={{ animationDuration: '4s' }}>Gemini</span>
            <span className="text-3xl md:text-5xl whitespace-nowrap flex-shrink-0 font-bold tracking-tight text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-pulse" style={{ animationDuration: '3.5s' }}>Cloudinary</span>
            <span className="text-3xl md:text-5xl whitespace-nowrap flex-shrink-0 font-bold italic font-serif text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse" style={{ animationDuration: '4.5s' }}>3BF & Co.</span>
            <img src="/bolmor-logo.png" alt="Bolmor Polytechnic" className="h-16 md:h-24 object-contain flex-shrink-0 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-pulse" style={{ animationDuration: '3.2s' }} />
            <img src="/nacos-logo.png" alt="NACOS" className="h-16 md:h-24 object-contain flex-shrink-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse" style={{ animationDuration: '4.2s' }} />
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="w-full py-20 md:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 md:p-24 shadow-2xl flex flex-col md:flex-row justify-around items-center gap-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1F6AE1]/10 via-transparent to-[#E916E6]/10"></div>
            <div className="text-center relative z-10">
              <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4"><AnimatedCounter target={10000} suffix="+" /></div>
              <div className="text-xl text-slate-300 font-semibold uppercase tracking-widest">Active Students</div>
            </div>
            <div className="hidden md:block w-px h-32 bg-white/10 relative z-10"></div>
            <div className="text-center relative z-10">
              <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1F6AE1] to-[#E916E6] mb-4"><AnimatedCounter target={500} suffix="+" /></div>
              <div className="text-xl text-slate-300 font-semibold uppercase tracking-widest">Live Rooms</div>
            </div>
            <div className="hidden md:block w-px h-32 bg-white/10 relative z-10"></div>
            <div className="text-center relative z-10">
              <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#E916E6] to-pink-500 mb-4"><AnimatedCounter target={50000} suffix="+" /></div>
              <div className="text-xl text-slate-300 font-semibold uppercase tracking-widest">Hours Streamed</div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="w-full max-w-7xl mx-auto py-20 md:py-32 px-6 md:px-12 relative z-10">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 tracking-tight">What Our Community Says</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-lg relative hover:-translate-y-2 transition-transform duration-300">
            <div className="text-6xl text-[#1F6AE1]/40 absolute top-6 right-6 font-serif">"</div>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 relative z-10 italic">
              "VoxCampus completely changed how I consume lectures. The audio clarity in live rooms is unmatched, and I can listen on the go."
            </p>
            <div className="relative z-10">
              <div className="font-bold text-white text-xl">Sarah Jenkins</div>
              <div className="text-cyan-400 font-medium">Graduate Student</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-lg relative hover:-translate-y-2 transition-transform duration-300">
            <div className="text-6xl text-[#E916E6]/40 absolute top-6 right-6 font-serif">"</div>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 relative z-10 italic">
              "Hosting virtual office hours has never been easier. My students love the interactive audio, and the setup is completely frictionless."
            </p>
            <div className="relative z-10">
              <div className="font-bold text-white text-xl">Dr. Marcus Webb</div>
              <div className="text-[#E916E6] font-medium">Professor of Physics</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-lg relative hover:-translate-y-2 transition-transform duration-300">
            <div className="text-6xl text-cyan-400/40 absolute top-6 right-6 font-serif">"</div>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 relative z-10 italic">
              "The trending algorithm is phenomenal. Our institution has seen a massive spike in cross-departmental lecture discovery."
            </p>
            <div className="relative z-10">
              <div className="font-bold text-white text-xl">Elena Rostova</div>
              <div className="text-cyan-400 font-medium">Department Head</div>
            </div>
          </div>

        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="w-full py-20 md:py-40 relative z-10 text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F6AE1]/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight">
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1F6AE1] to-[#E916E6]">Future</span> of Campus Audio
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Ready to elevate your learning experience? Sign up today and get instant access to thousands of live rooms and podcasts.
          </p>
          <Link 
            to="/signup" 
            className="inline-block bg-[#1F6AE1] hover:bg-blue-600 text-white font-bold py-5 px-12 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(31,106,225,0.5)] hover:shadow-[0_0_35px_rgba(31,106,225,0.8)] hover:scale-105 text-xl"
          >
            Get Started Now
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LandingView;
