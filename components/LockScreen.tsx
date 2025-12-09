
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LockScreenProps {
  kioskName: string;
  onUnlock: (pin: string) => boolean;
}

const LockScreen: React.FC<LockScreenProps> = ({ kioskName, onUnlock }) => {
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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-slate-700"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{kioskName}</h2>
        <p className="text-sm text-gray-500 mb-6">Insira o PIN para acessar</p>

        <div className="relative mb-6">
          <input 
            type="password" 
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={`w-full text-center text-3xl font-bold tracking-[1em] py-4 bg-gray-100 dark:bg-slate-700 rounded-xl border-2 outline-none transition-all ${error ? 'border-red-500 text-red-500 shake' : 'border-transparent focus:border-rose-500 text-gray-900 dark:text-white'}`}
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
