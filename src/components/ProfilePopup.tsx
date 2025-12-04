import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PENGUIN_COLORS } from '@/lib/penguinColors';

interface ProfilePopupProps {
  username: string;
  penguinColor?: string;
  coins?: number;
  stamps?: number;
  onClose: () => void;
  isMember?: boolean;
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({
  username,
  penguinColor = '#00BCD4',
  coins = 500,
  stamps = 0,
  onClose,
  isMember = false
}) => {
  // Find the penguin color data to get the preview image
  const penguinColorData = PENGUIN_COLORS.find(c => c.hex === penguinColor);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add a small delay for smooth animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={handleClose}
    >
      <div 
        className={`relative transform transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "400px" }}
      >
        {/* Main container */}
        <div 
          className="relative rounded-xl overflow-hidden"
          style={{ 
            background: "linear-gradient(to bottom, #4A90E2, #2E6BB4)",
            border: "4px solid #1E4A8B",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}
        >
          {/* Header bar */}
          <div 
            className="h-12 flex items-center justify-between px-4"
            style={{ 
              background: "linear-gradient(to bottom, #5BA0F2, #3E80D2)",
              borderBottom: "2px solid #1E4A8B"
            }}
          >
            {/* Member badge */}
            {isMember && (
              <div className="flex items-center">
                <div 
                  className="px-3 py-1 rounded flex items-center"
                  style={{ 
                    background: "linear-gradient(to bottom, #FFD700, #FFA500)",
                    border: "2px solid #B8860B"
                  }}
                >
                  <span className="text-xs font-bold text-black">MEMBER</span>
                </div>
              </div>
            )}
            
            {/* Username */}
            <h2 className="text-2xl font-bold text-white flex-1 text-center">
              {username}
            </h2>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                background: "#ff3333",
                border: "2px solid #cc0000"
              }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content area */}
          <div className="p-8">
            {/* Penguin image container */}
            <div 
              className="mx-auto mb-6 rounded-lg p-8 flex items-center justify-center"
              style={{ 
                width: "250px",
                height: "250px",
                background: 'radial-gradient(circle at center, #4A90E2 0%, #357ABD 30%, #2E5B8A 60%, #254470 100%)',
                border: "2px solid #1E4A8B"
              }}
            >
              {/* Penguin image based on selected color */}
              <img 
                src={penguinColorData?.previewImage || '/penguin-previews/cyan.png'}
                alt={`${username}'s ${penguinColorData?.name || 'Cyan'} penguin`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Stats */}
            <div className="space-y-3">
              {/* Coins */}
              <div 
                className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{ 
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      background: "linear-gradient(to bottom, #FFD700, #FFA500)",
                      border: "2px solid #B8860B"
                    }}
                  >
                    <span className="text-lg">🪙</span>
                  </div>
                  <span className="text-white font-semibold">Your Coins:</span>
                </div>
                <span className="text-white font-bold text-xl">{coins}</span>
              </div>

              {/* Stamps */}
              <div 
                className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{ 
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      background: "linear-gradient(to bottom, #4A90E2, #2E6BB4)",
                      border: "2px solid #1E4A8B"
                    }}
                  >
                    <span className="text-lg">📮</span>
                  </div>
                  <span className="text-white font-semibold">Your Stamps:</span>
                </div>
                <span className="text-white font-bold text-xl">{stamps}/234</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;