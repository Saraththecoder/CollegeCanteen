import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface Props {
  name: string;
}

export const WelcomeToast: React.FC<Props> = ({ name }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if not shown in this session yet
    const hasShown = sessionStorage.getItem('noir_welcome_shown');
    if (!hasShown) {
      setIsVisible(true);
      sessionStorage.setItem('noir_welcome_shown', 'true');
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-24 right-4 z-50 animate-slide-in">
      <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-white text-white p-5 shadow-2xl flex items-start gap-4 max-w-sm backdrop-blur-md bg-opacity-95">
        <div className="bg-white/10 p-2 rounded-full mt-0.5">
            <Sparkles className="w-4 h-4 text-yellow-200" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm uppercase tracking-widest text-white">Welcome Back</h4>
          <p className="text-sm text-gray-400 mt-1 font-light">
            Ready to order? <span className="text-white font-serif italic font-bold">{name}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-600 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};