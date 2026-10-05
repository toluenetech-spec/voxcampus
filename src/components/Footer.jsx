import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-950 pt-20 pb-8 mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Column 1 (Brand) */}
        <div className="flex flex-col items-start">
          <Logo className="scale-75 origin-left mb-2" />
          <p className="text-slate-400 mt-4 leading-relaxed">
            The next generation of interactive audio learning.
          </p>
        </div>

        {/* Column 2 (Platform) */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold mb-2 tracking-wide uppercase text-sm">Platform</h4>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Live Rooms</Link>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Discover Podcasts</Link>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Trending</Link>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">For Instructors</Link>
        </div>

        {/* Column 3 (Resources) */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold mb-2 tracking-wide uppercase text-sm">Resources</h4>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Help Center</Link>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Documentation</Link>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Community</Link>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">System Status</Link>
        </div>

        {/* Column 4 (Legal) */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold mb-2 tracking-wide uppercase text-sm">Legal</h4>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy Policy</Link>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Terms of Service</Link>
          <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Cookie Guidelines</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 gap-4">
        <div>&copy; 2026 VoxCampus. All rights reserved.</div>
        <div>Designed & Developed by Toluwalase Samuel.</div>
      </div>
    </footer>
  );
};

export default Footer;
