import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ThemeMode } from '../types';
import { getCurrentDateExtended } from '../utils';

interface HeaderProps {
  kioskName: string;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  onOpenSettings: () => void;
  onOpenNewExpense: () => void;
}

const Header: React.FC<HeaderProps> = ({ kioskName, themeMode, setThemeMode, onOpenSettings, onOpenNewExpense }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'glass shadow-soft py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer overflow-hidden border-2 border-white dark:border-slate-700"
          >
             <img src="/logo.svg?v=4" alt="Logo Estrela do Mar" className="w-full h-full object-cover" />
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-2xl font-black leading-none tracking-tight text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs transition-colors">{kioskName}</h1>
            <p className="text-rose-500 dark:text-rose-400 text-[10px] sm:text-xs font-bold tracking-widest uppercase mt-0.5">
              {getCurrentDateExtended()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex bg-gray-100/80 dark:bg-slate-800/80 rounded-full p-1 border border-white/20 dark:border-white/5 backdrop-blur-md">
            {(['light', 'auto', 'dark'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                className={`p-2 rounded-full transition-all duration-300 ${themeMode === mode ? 'bg-white dark:bg-slate-600 shadow-md text-rose-500 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
              >
                {mode === 'light' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                {mode === 'auto' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                {mode === 'dark' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSettings}
            className="p-3 rounded-full bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenNewExpense}
            className="hidden md:flex bg-gray-900 dark:bg-white text-white dark:text-ocean-900 font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all items-center gap-2 text-sm border border-transparent dark:border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
            Novo Lançamento
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;