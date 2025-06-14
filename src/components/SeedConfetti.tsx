
import React, { useEffect, useRef } from "react";

// Heel eenvoudige confetti, SVG-sparkles, auto-hide na 1s
const PARTICLES = 10;

const colors = [
  "#BFD7FF",
  "#B7E6D5",
  "#FFD6E0",
  "#F9F871",
  "#92A8F8"
];

export default function SeedConfetti({ show }: { show: boolean }) {
  const [visible, setVisible] = React.useState(show);
  const timeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (show) {
      setVisible(true);
      timeout.current = setTimeout(() => setVisible(false), 1000);
    }
    return () => clearTimeout(timeout.current);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-16 z-50" style={{ transform: "translateX(-50%)" }}>
      <div className="relative w-32 h-16">
        {[...Array(PARTICLES)].map((_, i) => {
          const rotate = Math.random() * 360;
          const left = 50 + Math.sin((i / PARTICLES) * 2 * Math.PI) * 40;
          const top = 15 + Math.cos((i / PARTICLES) * 2 * Math.PI) * 20;
          const color = colors[i % colors.length];
          return (
            <svg
              key={i}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                transform: `rotate(${rotate}deg) scale(1)`,
                opacity: 0.7
              }}
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <polygon
                points="8,0 10,6 16,6 11,10 13,16 8,12 3,16 5,10 0,6 6,6"
                fill={color}
              />
            </svg>
          );
        })}
      </div>
    </div>
  );
}
