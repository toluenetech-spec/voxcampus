import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Headphones, Radio, User, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const BottomNav = () => {
  const { theme, toggleTheme } = useAppContext();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
    { path: '/podcasts', icon: <Headphones size={24} />, label: 'Library' },
    { path: '/live', icon: <Radio size={24} />, label: 'Live' },
    { path: '/profile', icon: <User size={24} />, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-50 transition-colors duration-300 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-cyan-500 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium tracking-wide">{item.label}</span>
          </NavLink>
        ))}

        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          <span className="text-[10px] mt-1 font-medium tracking-wide">Theme</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
