import React from 'react';
import { Clock } from 'lucide-react';
import { OPENING_HOUR, CLOSING_HOUR, APP_NAME } from '../constants';

export const StoreClosed: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="border-2 border-black dark:border-white p-12 max-w-lg w-full relative transition-colors duration-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 dark:bg-black px-4 transition-colors duration-300">
          <Clock className="w-8 h-8 text-black dark:text-white" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-black dark:text-white mb-6 tracking-tight">
          Currently Closed
        </h1>
        
        <div className="w-16 h-1 bg-black dark:bg-white mx-auto mb-8"></div>
        
        <p className="text-gray-600 dark:text-gray-400 text-lg font-light mb-8 leading-relaxed">
          {APP_NAME} is offline at the moment. We are busy prepping for the next service.
        </p>
        
        <div className="space-y-2 font-mono text-sm text-gray-500 uppercase tracking-widest">
          <p>Opening Hours</p>
          <p className="text-black dark:text-white font-bold">{OPENING_HOUR}:00 - {CLOSING_HOUR}:00</p>
        </div>
      </div>
    </div>
  );
};