import React, { useState, useEffect } from 'react';
import '../styles/background-optimization.css';

interface OptimizedBackgroundProps {
  imageSrc: string;
  className?: string;
}

export const OptimizedBackground: React.FC<OptimizedBackgroundProps> = ({ imageSrc, className = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Since we're now in a fixed aspect ratio container, always use 100% coverage
  const getBackgroundSize = () => {
    return '100% 100%';
  };

  return (
    <>
      {/* Main background layer */}
      <div 
        className={`absolute inset-0 optimized-background gpu-accelerated hq-filter ${className}`}
        style={{
          backgroundImage: imageLoaded ? `url('${imageSrc}')` : 'none',
          backgroundSize: getBackgroundSize(),
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#87CEEB', // Sky blue fallback
          imageRendering: 'optimizeQuality',
          WebkitImageRendering: 'optimizeQuality',
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          minWidth: '100vw',
          transform: 'translateZ(0)', // Hardware acceleration + slight scale
          transformOrigin: 'center center',
        }}
      />
      
      {/* Enhancement layer for better perceived quality */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: imageLoaded ? `url('${imageSrc}')` : 'none',
          backgroundSize: getBackgroundSize(),
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          mixBlendMode: 'soft-light',
          opacity: 0.4,
          filter: 'contrast(1.2) saturate(1.1) blur(0.5px)',
          transform: 'translateZ(0)',
          transformOrigin: 'center center',
        }}
      />
      
      {/* Loading state */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-200 animate-pulse" />
      )}
    </>
  );
};