import React from 'react';
import { X } from 'lucide-react';

interface HowItWorksPopupProps {
  onClose: () => void;
}

export const HowItWorksPopup: React.FC<HowItWorksPopupProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50">
      {/* White perimeter */}
      <div 
        className="relative w-full max-w-3xl p-8 bg-white rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Blue container */}
        <div 
          className="bg-blue-500 rounded-2xl p-8 text-white"
          style={{ backgroundColor: '#4BA6FF' }}
        >
          {/* Headline */}
          <h1 
            className="text-3xl font-bold text-center mb-8 text-white"
            style={{ fontFamily: "'Bowlby One', cursive" }}
          >
            Welcome to Club Penguin on Solana!
          </h1>

          {/* Body Copy */}
          <div className="space-y-6" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 font-bold text-blue-600"
                style={{ fontFamily: "'Arial', sans-serif" }}
              >
                1
              </div>
              <div>
                <h3 className="font-normal text-lg mb-1">Click "Create Penguin."</h3>
                <p className="text-blue-100 font-light">Start your adventure by generating your own in-game penguin.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 font-bold text-blue-600"
                style={{ fontFamily: "'Arial', sans-serif" }}
              >
                2
              </div>
              <div>
                <h3 className="font-normal text-lg mb-1">Name your penguin & save your private key.</h3>
                <p className="text-blue-100 font-light">The private key is the password to your built-in wallet—store it safely!</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 font-bold text-blue-600"
                style={{ fontFamily: "'Arial', sans-serif" }}
              >
                3
              </div>
              <div>
                <h3 className="font-normal text-lg mb-1">Press "Launch Penguin."</h3>
                <p className="text-blue-100 font-light">With one click we mint a BONK.fun token for your penguin and drop you straight into the island—no external wallet required.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 font-bold text-blue-600"
                style={{ fontFamily: "'Arial', sans-serif" }}
              >
                4
              </div>
              <div>
                <h3 className="font-normal text-lg mb-1">Explore our 1:1 Club Penguin world.</h3>
                <p className="text-blue-100 font-light">Waddle around, meet new friends, and trade each other's coins as you enjoy the nostalgia-packed remake.</p>
              </div>
            </div>
          </div>

          {/* Got it button */}
          <div className="mt-8 text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white text-blue-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              style={{ fontFamily: "'Bowlby One', cursive" }}
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};