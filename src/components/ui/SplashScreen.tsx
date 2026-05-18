import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export const SplashScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-slate-900"
    >
      <div className="relative mb-12">
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className="w-24 h-24 bg-blue-900 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/20 border-4 border-white"
        >
          <Star className="text-white" size={40} fill="currentColor" />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.15, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-2 bg-red-600 rounded-full blur-xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <h1 className="text-2xl font-black tracking-[0.25em] mb-1 uppercase text-blue-900 leading-none">New Age</h1>
        <h1 className="text-2xl font-black tracking-[0.25em] mb-4 uppercase text-red-600">Of America</h1>
        <p className="text-slate-500 font-bold tracking-[0.4em] uppercase text-[9px]">Continental Private Wealth</p>
      </motion.div>

      <div className="absolute bottom-16 w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-1/2 h-full bg-blue-900 rounded-full"
        />
      </div>
    </motion.div>
  );
};
