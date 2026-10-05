import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Headphones, Radio, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Logo from './Logo';

const Sidebar = () => {
  const { logout, theme, toggleTheme } = useAppContext();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/podcasts', icon: <Headphones size={20} />, label: 'Library' },
    { path: '/live', icon: <Radio size={20} />, label: 'Live Rooms' },
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <div className="hidden md:flex flex-col w-[250px] h-screen fixed top-0 left-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 z-50 transition-colors duration-300">
      <div className="p-8 flex justify-between items-center">
        <Logo className="scale-[0.85] origin-left" />
      </div>

      <div className="flex flex-col flex-1 px-4 mt-2 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
                ? 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:scale-105'
              }`
            }
          >
            {item.icon}
            <span className="font-semibold tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 mb-4 flex flex-col space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all duration-300"
        >
          <div className="flex items-center space-x-4">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-semibold tracking-wide">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </button>

        <button
          onClick={logout}
          className="flex items-center space-x-4 w-full px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border hover:border-red-200 dark:hover:border-red-500/30 transition-all duration-300"
        >
          <LogOut size={20} />
          <span className="font-semibold tracking-wide">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
