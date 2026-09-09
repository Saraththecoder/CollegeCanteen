import React, { useEffect, useState } from 'react';
import { UtensilsCrossed, Sparkles, ChevronRight } from 'lucide-react';
import { APP_NAME } from '../constants';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number; // duration in ms before auto-dismiss
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  minDuration = 1600 
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 450); // Matches the transition duration
  };

  return (
    <div
      role="status"
      aria-label="Application splash screen"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black text-white selection:bg-white selection:text-black cursor-pointer transition-all duration-500 ease-out px-6 py-10 ${
        isFadingOut ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/[0.03] rounded-full blur-2xl" />
      </div>

      {/* Top bar: minimal campus badge & Skip button */}
      <div className="w-full max-w-md flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Campus Express</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="flex items-center gap-1 text-[11px] font-mono tracking-widest uppercase text-zinc-400 hover:text-white px-3 py-1 rounded-full border border-zinc-800 hover:border-zinc-600 transition-all"
        >
          <span>Skip</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Center: Brand Mark, Monogram & Title */}
      <div className="flex flex-col items-center text-center my-auto z-10 max-w-sm">
        {/* Emblem */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Subtle outer decorative rings */}
          <div className="absolute -inset-4 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '14s' }} />
          <div className="absolute -inset-8 rounded-full border border-dashed border-white/5 animate-spin" style={{ animationDuration: '24s', animationDirection: 'reverse' }} />

          <div className="w-20 h-20 bg-zinc-950 border border-zinc-700/80 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <UtensilsCrossed className="w-9 h-9 text-white transition-transform duration-500 group-hover:scale-110" />
            <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute top-2.5 right-2.5 animate-pulse" />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.25em] text-white uppercase mb-2">
          {APP_NAME}
        </h1>

        <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-zinc-400">
          Fast • Fresh • Seamless
        </p>
      </div>

      {/* Bottom: Minimal aesthetic footer without progress bar */}
      <div className="w-full max-w-xs flex flex-col items-center gap-2 z-10 mb-4 text-center">
        <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
};
