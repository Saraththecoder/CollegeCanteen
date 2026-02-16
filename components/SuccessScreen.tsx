import React, { useEffect, useState } from 'react';

interface SuccessScreenProps {
  isVisible: boolean;
  message: string;
  subMessage?: string;
  onComplete: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ isVisible, message, subMessage, onComplete }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);

      return () => {
        clearTimeout(timer);
        // Restore body scroll
        document.body.style.overflow = 'unset';
      };
    } else {
      setShow(false);
      document.body.style.overflow = 'unset';
    }
  }, [isVisible, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-300 animate-fade-in">
      {/* Scale wrapper for pop effect */}
      <div className="relative w-24 h-24 mb-8 animate-scale">
        <svg className="w-full h-full text-green-500" viewBox="0 0 52 52">
          <circle 
            className="stroke-current text-green-500 opacity-20" 
            cx="26" cy="26" r="25" fill="none" strokeWidth="2"
          />
          <circle 
            className="stroke-current text-green-500 animate-stroke" 
            cx="26" cy="26" r="25" fill="none" strokeWidth="2"
            strokeDasharray="166" strokeDashoffset="166"
            style={{ animationDelay: '0.2s' }}
          />
          <path 
            className="stroke-current text-green-500 animate-stroke" 
            fill="none" 
            d="M14.1 27.2l7.1 7.2 16.7-16.8" 
            strokeWidth="2"
            strokeDasharray="48" strokeDashoffset="48"
            style={{ animationDelay: '0.5s' }}
          />
        </svg>
      </div>

      <h2 className="text-3xl font-serif font-bold text-black dark:text-white mb-2 animate-fade-in" style={{ animationDelay: '0.8s' }}>
        {message}
      </h2>
      
      {subMessage && (
        <p className="text-gray-500 text-sm font-mono uppercase tracking-widest animate-fade-in" style={{ animationDelay: '1s' }}>
          {subMessage}
        </p>
      )}
    </div>
  );
};