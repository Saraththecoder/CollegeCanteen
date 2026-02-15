import React from 'react';
import { Clock } from 'lucide-react';
import { OPENING_HOUR, CLOSING_HOUR, APP_NAME } from '../constants';

export const StoreClosed: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="border-2 border-white p-12 max-w-lg w-full relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-4">
          <Clock className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight">
          Currently Closed
        </h1>
        
        <div className="w-16 h-1 bg-white mx-auto mb-8"></div>
        
        <p className="text-gray-400 text-lg font-light mb-8">
          {APP_NAME} is offline at the moment. We are busy prepping for the next service.
        </p>
        
        <div className="space-y-2 font-mono text-sm text-gray-500 uppercase tracking-widest">
          <p>Opening Hours</p>
          <p className="text-white font-bold">{OPENING_HOUR}:00 - {CLOSING_HOUR}:00</p>
        </div>
      </div>
    </div>
  );
};