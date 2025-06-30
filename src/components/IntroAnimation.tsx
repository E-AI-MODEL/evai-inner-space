
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const IntroAnimation = ({ onFinished }: { onFinished: () => void }) => {
  const [animationState, setAnimationState] = useState('in');
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const { authorizeChat } = useAuth();

  const handleHeartClick = () => {
    const now = Date.now();
    
    // Reset count if more than 2 seconds between clicks
    if (now - lastClickTime > 2000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    
    setLastClickTime(now);
    
    // Easter egg: 3 clicks within 2 seconds activates access
    if (clickCount >= 2) {
      console.log('🎉 Easter egg activated!');
      authorizeChat();
      
      // Start fade out immediately
      setAnimationState('out');
      setTimeout(() => {
        onFinished();
      }, 1000);
    }
  };

  useEffect(() => {
    // Normal fade out after 3 seconds if not activated via easter egg
    const fadeOutTimer = setTimeout(() => {
      if (animationState === 'in') {
        setAnimationState('out');
      }
    }, 2000);

    const finishTimer = setTimeout(() => {
      if (animationState !== 'out') {
        onFinished();
      }
    }, 3000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished, animationState]);

  return (
    <div
      className={`fixed inset-0 bg-background z-50 flex flex-col items-center justify-center transition-opacity duration-1000 ${
        animationState === 'in' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="animate-in fade-in zoom-in-95 duration-1000">
        <div className="flex flex-col items-center">
          <button
            onClick={handleHeartClick}
            className="text-6xl select-none hover:scale-110 transition-transform duration-200 cursor-pointer focus:outline-none"
            aria-label="EvAI logo"
          >
            💙
          </button>
          <h1 className="mt-4 font-semibold text-3xl tracking-wide text-zinc-800">
            EvAI Bèta Chat
          </h1>
          {clickCount > 0 && clickCount < 3 && (
            <p className="text-sm text-gray-500 mt-2 animate-pulse">
              {clickCount}/3 clicks...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
