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
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 h-full">
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.4 }} // Faster, less bouncy
            className={`bg-white dark:bg-slate-800 sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl w-full ${maxWidth} relative flex flex-col border border-gray-100 dark:border-slate-700 overflow-hidden max-h-[95vh] h-full`}
          >
            {/* Header Fixed */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md z-20 shrink-0">
              <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white tracking-tight truncate pr-4">{title}</h2>
              <button
                onClick={onClose}
                className="group p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shrink-0 outline-none focus:ring-2 focus:ring-rose-500/50"
                aria-label="Fechar"
              >
                 <div className="relative w-6 h-6 flex items-center justify-center">
                    <span className="absolute w-5 h-0.5 bg-gray-400 dark:bg-gray-500 rotate-45 group-hover:bg-rose-500 transition-colors rounded-full"></span>
                    <span className="absolute w-5 h-0.5 bg-gray-400 dark:bg-gray-500 -rotate-45 group-hover:bg-rose-500 transition-colors rounded-full"></span>
                 </div>
              </button>
            </div>
            
            {/* Scrollable Content Container - Flex Grow to fill height */}
            {/* Added 'isolation-isolate' to ensure z-indexes inside children work relative to this container */}
            <div className="flex-1 overflow-hidden relative bg-surface-50 dark:bg-slate-900/50 flex flex-col isolate">
               <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-0 sm:p-0 h-full flex flex-col">
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