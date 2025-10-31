import React, { useState, useRef, useCallback } from 'react';
import { History } from 'lucide-react';

interface DraggableEmotionHistoryButtonProps {
  onOpen: () => void;
}

const DraggableEmotionHistoryButton = React.forwardRef<HTMLButtonElement, DraggableEmotionHistoryButtonProps>(({ onOpen }, ref) => {
  const [position, setPosition] = useState(() => {
    // Load saved position from localStorage or use default
    const saved = localStorage.getItem('emotion-history-button-position');
    return saved ? JSON.parse(saved) : { x: 16, y: 80 }; // Default: left: 16px, bottom: 80px
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const internalRef = useRef<HTMLButtonElement>(null);

  // Merge external ref from Radix asChild with internal ref
  const setRefs = useCallback((node: HTMLButtonElement | null) => {
    internalRef.current = node as HTMLButtonElement | null;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref && 'current' in (ref as any)) {
      (ref as any).current = node;
    }
  }, [ref]);

  const savePosition = useCallback((newPosition: { x: number; y: number }) => {
    localStorage.setItem('emotion-history-button-position', JSON.stringify(newPosition));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!internalRef.current) return;
    
    const rect = internalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!internalRef.current) return;
    
    const rect = internalRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const newX = clientX - dragOffset.x;
    const newY = window.innerHeight - (clientY - dragOffset.y) - 48; // 48px is button height

    // Keep button within screen bounds
    const maxX = window.innerWidth - 48; // 48px is button width
    const maxY = window.innerHeight - 48;
    
    const boundedPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };

    setPosition(boundedPosition);
  }, [isDragging, dragOffset]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleMove]);

  const handleEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(position);
    }
  }, [isDragging, position, savePosition]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onOpen if we're not dragging
    if (!isDragging) {
      onOpen();
    }
  };

  return (
    <button
      ref={setRefs}
      type="button"
      aria-label="Toon emotiegeschiedenis (versleepbaar)"
      className={`md:hidden fixed z-40 p-3 rounded-full bg-background border border-border shadow-lg hover:shadow-xl transition-shadow select-none ${
        isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'
      }`}
      style={{
        left: `${position.x}px`,
        bottom: `${position.y}px`,
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      <History size={20} className="text-foreground" />
      {isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded whitespace-nowrap border border-border">
          Versleep naar gewenste plek
        </div>
      )}
    </button>
  );
});

DraggableEmotionHistoryButton.displayName = 'DraggableEmotionHistoryButton';

export default DraggableEmotionHistoryButton;
