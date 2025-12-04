import React from 'react';

interface GameHUDProps {
  health?: number;
  maxHealth?: number;
  coins?: number;
  mana?: number;
  maxMana?: number;
  stamina?: number;
  maxStamina?: number;
}

const GameHUD: React.FC<GameHUDProps> = ({
  health = 1000,
  maxHealth = 1000,
  coins = 0,
  mana = 10,
  maxMana = 10,
  stamina = 10,
  maxStamina = 10,
}) => {
  const healthPercentage = (health / maxHealth) * 100;
  const manaPercentage = (mana / maxMana) * 100;
  const staminaPercentage = (stamina / maxStamina) * 100;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      {/* Main HUD Container - Dark gray/black background */}
      <div 
        className="relative flex items-center"
        style={{
          backgroundColor: '#1a1a1a',
          padding: '6px 10px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          fontFamily: "'Silkscreen', monospace",
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0px',
          imageRendering: 'pixelated',
          WebkitFontSmoothing: 'none',
        }}
      >
        {/* Health Bar Section */}
        <div className="flex items-center mr-5">
          <img 
            src="/hud-heart.png" 
            alt="Health" 
            className="w-5 h-5 mr-2"
            style={{ imageRendering: 'pixelated' }}
          />
          <div 
            className="relative"
            style={{
              width: '120px',
              height: '16px',
              backgroundColor: '#000',
              border: '1px solid #333',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div 
              className="absolute inset-0"
              style={{
                width: `${healthPercentage}%`,
                background: 'linear-gradient(to bottom, #ff4444 0%, #cc0000 50%, #990000 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            />
            <span 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                color: 'white',
                textShadow: '1px 1px 1px rgba(0, 0, 0, 0.8)',
                fontSize: '10px',
              }}
            >
              {health}/{maxHealth}
            </span>
          </div>
        </div>

        {/* Coins Section */}
        <div className="flex items-center mr-5">
          <img 
            src="/hud-coins.png" 
            alt="Coins" 
            className="w-5 h-5 mr-2"
            style={{ imageRendering: 'pixelated' }}
          />
          <span 
            style={{
              color: '#ffcc00',
              textShadow: '1px 1px 1px rgba(0, 0, 0, 0.8)',
              minWidth: '30px',
            }}
          >
            {coins}%
          </span>
        </div>

        {/* Mana Bar Section */}
        <div className="flex items-center mr-5">
          <img 
            src="/hud-mana.png" 
            alt="Mana" 
            className="w-5 h-5 mr-2"
            style={{ imageRendering: 'pixelated' }}
          />
          <div 
            className="relative"
            style={{
              width: '100px',
              height: '16px',
              backgroundColor: '#000',
              border: '1px solid #333',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div 
              className="absolute inset-0"
              style={{
                width: `${manaPercentage}%`,
                background: 'linear-gradient(to bottom, #8b7ff7 0%, #5d4fc8 50%, #3d3299 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            />
            <span 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                color: 'white',
                textShadow: '1px 1px 1px rgba(0, 0, 0, 0.8)',
                fontSize: '10px',
              }}
            >
              {mana}/{maxMana}
            </span>
          </div>
        </div>

        {/* Stamina Bar Section */}
        <div className="flex items-center">
          <img 
            src="/hud-stamina.png" 
            alt="Stamina" 
            className="w-5 h-5 mr-2"
            style={{ imageRendering: 'pixelated' }}
          />
          <div 
            className="relative"
            style={{
              width: '100px',
              height: '16px',
              backgroundColor: '#000',
              border: '1px solid #333',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div 
              className="absolute inset-0"
              style={{
                width: `${staminaPercentage}%`,
                background: 'linear-gradient(to bottom, #4dd9ff 0%, #00b8d4 50%, #008ba3 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            />
            <span 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                color: 'white',
                textShadow: '1px 1px 1px rgba(0, 0, 0, 0.8)',
                fontSize: '10px',
              }}
            >
              {stamina}/{maxStamina}
            </span>
          </div>
        </div>

        {/* Small decorative element on the right */}
        <div 
          className="ml-3"
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div 
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#666',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GameHUD;