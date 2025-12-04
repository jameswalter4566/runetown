import React, { useState, useEffect, useRef } from 'react';
import { Character, CharacterType } from '@/types/game';
import './GameMap.css';

interface GameMapProps {
  character: CharacterType;
}

const GameMap: React.FC<GameMapProps> = ({ character: characterType }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  
  const [character, setCharacter] = useState<Character>({
    type: characterType,
    x: 400,
    y: 300,
    isMoving: false,
    direction: 'right',
    animationFrame: 0
  });

  const MOVE_SPEED = 3;
  const ANIMATION_SPEED = 150; // ms per frame

  useEffect(() => {
    let lastAnimationTime = 0;

    const gameLoop = (timestamp: number) => {
      // Update animation frame
      if (timestamp - lastAnimationTime > ANIMATION_SPEED) {
        setCharacter(prev => ({
          ...prev,
          animationFrame: prev.isMoving ? (prev.animationFrame + 1) % 4 : 0
        }));
        lastAnimationTime = timestamp;
      }

      // Move character towards target
      setCharacter(prev => {
        if (!prev.targetX || !prev.targetY || !prev.isMoving) return prev;

        const dx = prev.targetX - prev.x;
        const dy = prev.targetY - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MOVE_SPEED) {
          return { ...prev, x: prev.targetX, y: prev.targetY, isMoving: false, targetX: undefined, targetY: undefined };
        }

        const moveX = (dx / distance) * MOVE_SPEED;
        const moveY = (dy / distance) * MOVE_SPEED;

        return {
          ...prev,
          x: prev.x + moveX,
          y: prev.y + moveY,
          direction: moveX > 0 ? 'right' : 'left'
        };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCharacter(prev => ({
      ...prev,
      targetX: x,
      targetY: y,
      isMoving: true
    }));
  };

  const getCharacterSprite = () => {
    // Return placeholder text instead of emoji
    return character.type.toUpperCase();
  };

  const getWalkingAnimation = () => {
    if (!character.isMoving) return '';
    
    const bounce = character.animationFrame % 2 === 0 ? -2 : 2;
    return `translateY(${bounce}px)`;
  };

  return (
    <div className="min-h-screen bg-tan-100" style={{ backgroundColor: '#D2B48C' }}>
      <div 
        ref={mapRef}
        className="relative w-full h-screen cursor-pointer overflow-hidden"
        onClick={handleMapClick}
        style={{
          background: 'linear-gradient(135deg, #D2B48C 0%, #C19A6B 50%, #D2B48C 100%)',
        }}
      >
        {/* Grid pattern overlay for visual interest */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              #8B7355,
              #8B7355 1px,
              transparent 1px,
              transparent 40px
            ),
            repeating-linear-gradient(
              90deg,
              #8B7355,
              #8B7355 1px,
              transparent 1px,
              transparent 40px
            )`
          }}
        />

        {/* Character */}
        <div
          className="absolute transition-none"
          style={{
            left: character.x - 25,
            top: character.y - 25,
            transform: `${getWalkingAnimation()} scaleX(${character.direction === 'left' ? -1 : 1})`,
            transition: 'transform 0.15s'
          }}
        >
          <div className="relative">
            {/* Shadow */}
            <div 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black opacity-20 rounded-full"
              style={{
                width: '40px',
                height: '10px',
                marginBottom: '-5px'
              }}
            />
            
            {/* Character sprite */}
            <div className="text-5xl select-none">
              {getCharacterSprite()}
            </div>

            {/* Walking dust effect */}
            {character.isMoving && (
              <div 
                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 ${character.animationFrame % 2 === 0 ? 'dust-effect' : ''}`}
                style={{
                  opacity: character.animationFrame % 2 === 0 ? 1 : 0
                }}
              >
                <span className="text-2xl">💨</span>
              </div>
            )}
          </div>
        </div>

        {/* Click indicator */}
        {character.targetX && character.targetY && character.isMoving && (
          <div
            className="absolute pointer-events-none pulse-effect"
            style={{
              left: character.targetX - 15,
              top: character.targetY - 15
            }}
          >
            <div className="w-8 h-8 rounded-full border-4 border-white opacity-60" />
          </div>
        )}

        {/* Instructions */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg">
          <h3 className="font-bold text-lg mb-2">How to Play</h3>
          <p className="text-sm">Click anywhere on the map to move your character!</p>
          <p className="text-sm mt-1">Character: {character.type.charAt(0).toUpperCase() + character.type.slice(1)}</p>
        </div>
      </div>
    </div>
  );
};

export default GameMap;