
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const IntroAnimation = ({ onFinished }: { onFinished: () => void }) => {
  const [animationState, setAnimationState] = useState('in');
  const { authorizeChat } = useAuth();

  useEffect(() => {
    // Authorize chat access
    authorizeChat();
    
    // Fade out after 2 seconds
    const fadeOutTimer = setTimeout(() => {
      setAnimationState('out');
    }, 2000);

    // Finish animation after 3 seconds
    const finishTimer = setTimeout(() => {
      onFinished();
    }, 3000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished, authorizeChat]);

  return (
    <div
      className={`fixed inset-0 bg-background z-50 flex flex-col items-center justify-center transition-opacity duration-1000 ${
        animationState === 'in' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="animate-in fade-in zoom-in-95 duration-1000">
        <div className="flex flex-col items-center">
          <div
            className="text-6xl select-none"
            aria-label="EvAI logo"
          >
            💙
          </div>
          <h1 className="mt-4 font-semibold text-3xl tracking-wide text-zinc-800">
            EvAI Bèta Chat
          </h1>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
