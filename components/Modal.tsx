import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 h-full">
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.5 }}
            className={`bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full ${maxWidth} relative flex flex-col border border-gray-100 dark:border-slate-700 overflow-hidden max-h-[95vh] h-full`}
          >
            {/* Header Fixed */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md z-10 shrink-0">
              <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white tracking-tight truncate pr-4">{title}</h2>
              <button
                onClick={onClose}
                className="group p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                aria-label="Fechar"
              >
                 <div className="relative w-6 h-6 flex items-center justify-center">
                    <span className="absolute w-5 h-0.5 bg-gray-400 dark:bg-gray-500 rotate-45 group-hover:bg-rose-500 transition-colors rounded-full"></span>
                    <span className="absolute w-5 h-0.5 bg-gray-400 dark:bg-gray-500 -rotate-45 group-hover:bg-rose-500 transition-colors rounded-full"></span>
                 </div>
              </button>
            </div>
            
            {/* Scrollable Content Container - Flex Grow to fill height */}
            <div className="flex-1 overflow-hidden relative bg-surface-50 dark:bg-slate-900/50 flex flex-col">
               <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-4 md:p-6">
                 {children}
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;