import React from 'react';
import { Button } from '@/components/ui/button';

interface MainMenuProps {
  onStart: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl text-gray-300 mb-8">
          Battle for supremacy in this epic faction-based warfare
        </p>
        
        <Button
          onClick={onStart}
          className="px-12 py-6 text-2xl bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-200"
        >
          Enter the Battlefield
        </Button>
        
        <div className="mt-12 text-gray-400 max-w-2xl mx-auto">
          <p className="mb-4">
            Choose your faction, build your army, and conquer territories in this multiplayer battle arena.
          </p>
          <p>
            Each faction has its own treasury powered by SOL. Join forces to strengthen your faction's economy and dominate the battlefield!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;