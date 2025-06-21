
import { useState, useEffect } from 'react';

export const useEasterEgg = (onSpecialLogin: () => void) => {
  const [iconClickCount, setIconClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Reset click count after 3 seconds of inactivity
  useEffect(() => {
    if (iconClickCount > 0) {
      const timer = setTimeout(() => {
        setIconClickCount(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [iconClickCount, lastClickTime]);

  const handleIconClick = () => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    // Reset count if more than 2 seconds between clicks
    if (timeDiff > 2000) {
      setIconClickCount(1);
    } else {
      setIconClickCount(prev => prev + 1);
    }
    
    setLastClickTime(currentTime);
    
    // Trigger special login on 3rd click
    if (iconClickCount + 1 >= 3) {
      onSpecialLogin();
      setIconClickCount(0);
    }
  };

  return {
    iconClickCount,
    handleIconClick
  };
};
