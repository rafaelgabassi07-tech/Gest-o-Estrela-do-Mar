
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LockScreenProps {
  kioskName: string;
  onUnlock: (pin: string) => boolean;
  customLogo?: string | null;
  embedded?: boolean; // New prop to handle inline display
}

const LockScreen: React.FC<LockScreenProps> = ({ kioskName, onUnlock, customLogo, embedded = false }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleAttempt = () => {
    if (onUnlock(pin)) {
      setPin('');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setPin('');
    }
  };

  const containerClasses = embedded 
    ? "h-full w-full flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700 mt-4" 
    : "min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 fixed inset-0 z-[60]";

  return (
    <div className={containerClasses}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-slate-200 dark:border-slate-700 ${embedded ? 'shadow-soft' : ''}`}
      >
        {!embedded && (
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl mx-auto mb-6 border-4 border-slate-100 dark:border-slate-700 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-gray-300 dark:text-gray-500">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                </svg>
            )}
            </div>
        )}
        
        {embedded ? (
            <div className="mb-6">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Financeiro Bloqueado</h3>
                <p className="text-xs text-gray-500">Digite o PIN para visualizar o faturamento</p>
            </div>
        ) : (
            <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{kioskName}</h2>
                <p className="text-sm text-gray-500 mb-6">Insira o PIN para acessar</p>
            </>
        )}

        <div className="relative mb-6">
          <input 
            type="password" 
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={`w-full text-center text-3xl font-bold tracking-[1em] py-4 bg-gray-100 dark:bg-slate-700 rounded-xl border-2 outline-none transition-all ${error ? 'border-red-500 text-red-500 shake' : 'border-transparent focus:border-rose-500 text-gray-900 dark:text-white'}`}
            placeholder="••••"
          />
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleAttempt}
          className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/30"
        >
          Desbloquear
        </motion.button>
      </motion.div>
    </div>
  );
};

export default LockScreen;
