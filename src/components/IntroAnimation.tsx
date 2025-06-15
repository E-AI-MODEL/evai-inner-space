
import React, { useEffect, useState } from 'react';

const IntroAnimation = ({ onFinished }: { onFinished: () => void }) => {
  const [animationState, setAnimationState] = useState('in');

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setAnimationState('out');
    }, 2000); // Start fading out after 2 seconds

    const finishTimer = setTimeout(() => {
      onFinished();
    }, 3000); // Finish after 3 seconds total

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 bg-background z-50 flex flex-col items-center justify-center transition-opacity duration-1000 ${
        animationState === 'in' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="animate-in fade-in zoom-in-95 duration-1000">
        <div className="flex flex-col items-center">
          <span aria-label="EvAI logo" className="text-6xl select-none">
            💙
          </span>
          <h1 className="mt-4 font-semibold text-3xl tracking-wide text-zinc-800">
            EvAI Bèta Chat
          </h1>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
