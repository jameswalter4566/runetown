import React, { useEffect, useRef, useState } from 'react';

interface FixedAspectRatioWrapperProps {
  children: React.ReactNode;
  aspectRatio?: number;
}

export const FixedAspectRatioWrapper: React.FC<FixedAspectRatioWrapperProps> = ({ 
  children, 
  aspectRatio = 16 / 9 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameSize, setGameSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const calculateSize = () => {
      if (!containerRef.current) return;

      // Fixed game size at 16:9 ratio - no scaling
      const baseWidth = 1920;
      const baseHeight = 1080;

      setGameSize({ width: baseWidth, height: baseHeight });
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    
    return () => {
      window.removeEventListener('resize', calculateSize);
    };
  }, [aspectRatio]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full"
      style={{
        overflow: 'auto',
        position: 'relative',
        background: 'linear-gradient(to bottom, #1E4A8B, #4A90E2)',
        minHeight: '100vh'
      }}
    >
      <div
        style={{
          width: `${gameSize.width}px`,
          height: `${gameSize.height}px`,
          position: 'relative',
          margin: '0 auto',
          zoom: 1,
          transform: 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};