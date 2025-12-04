import React from 'react';
import { PENGUIN_COLORS } from '@/lib/penguinColors';

interface ExistingPenguinCardProps {
  username: string;
  penguinColor: string;
  onLoginDifferent: () => void;
  onPlay: () => void;
}

const ExistingPenguinCard = ({ username, penguinColor, onLoginDifferent, onPlay }: ExistingPenguinCardProps) => {
  console.log('=== EXISTING PENGUIN CARD DEBUG ===');
  console.log('Username:', username);
  console.log('Penguin color received:', penguinColor);
  
  // Get penguin image from the centralized color configuration
  const getPenguinImage = (color: string) => {
    console.log('Looking up penguin image for color:', color);
    const penguinColorData = PENGUIN_COLORS.find(c => c.hex === color);
    console.log('Found penguin color data:', penguinColorData);
    const imageUrl = penguinColorData?.previewImage || '/penguin-previews/cyan.png';
    console.log('Using image URL:', imageUrl);
    return imageUrl;
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Prevent any action when clicking the background
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        background: 'radial-gradient(circle at center, #4A90E2 0%, #357ABD 30%, #2E5B8A 60%, #254470 100%)',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important'
      }}
      onClick={handleBackgroundClick}
    >
      <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* Penguin Card */}
        <div 
          className="relative bg-white p-4 rounded-lg shadow-lg"
          style={{
            width: '400px',
            height: '500px',
            border: '8px solid #E0E0E0',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          {/* Inner blue background */}
          <div 
            className="w-full h-full rounded-lg flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 50%, #2E5B8A 100%)',
              borderRadius: '12px'
            }}
          >
            {/* Penguin Image */}
            <div className="flex-1 flex items-center justify-center">
              <img 
                src={getPenguinImage(penguinColor)}
                alt={`${username}'s penguin`}
                style={{
                  width: '200px',
                  height: 'auto',
                  maxHeight: '250px',
                  objectFit: 'contain'
                }}
              />
            </div>
            
            {/* Username */}
            <div className="pb-8">
              <h1 
                className="text-white text-center text-4xl font-bold"
                style={{
                  fontFamily: 'Bowlby One, cursive !important',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              >
                {username}
              </h1>
            </div>
          </div>

          {/* Play button - clickable card overlay */}
          <button
            onClick={onPlay}
            className="absolute inset-0 w-full h-full bg-transparent border-none cursor-pointer hover:opacity-95 transition-opacity"
            style={{ zIndex: 1 }}
            aria-label={`Play as ${username}`}
          />
        </div>

        {/* Login as different penguin button */}
        <div className="mt-8">
          <button
            onClick={onLoginDifferent}
            className="text-white font-normal text-lg hover:underline hover:text-blue-200 transition-colors duration-200"
            style={{
              fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important',
              fontWeight: 'normal !important',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Login as a different penguin
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExistingPenguinCard;