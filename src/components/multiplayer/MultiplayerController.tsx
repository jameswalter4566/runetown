import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OtherPlayerOptimized } from './OtherPlayerOptimized';
import { Html } from '@react-three/drei';

interface MultiplayerControllerProps {
  player: {
    id: string;
    name: string;
    position: { x: number; y: number; z: number };
    targetPosition?: { x: number; y: number; z: number };
    sourcePosition?: { x: number; y: number; z: number };
    movementStartTime?: number;
    direction: string; // Direction as string (N, NE, E, etc.)
    modelType: string;
    lastUpdate: number;
    chatMessage?: string;
    chatTimestamp?: number;
  };
  showDebug?: boolean;
}

// Convert direction string to rotation angle
const getRotationFromDirection = (dir: string): number => {
  const directionMap: { [key: string]: number } = {
    'N': 0,                 // Face north when moving north
    'NE': -Math.PI / 4,     // Face northeast when moving northeast
    'E': -Math.PI / 2,      // Face east when moving east
    'SE': -3 * Math.PI / 4, // Face southeast when moving southeast
    'S': Math.PI,           // Face south when moving south
    'SW': 3 * Math.PI / 4,  // Face southwest when moving southwest
    'W': Math.PI / 2,       // Face west when moving west
    'NW': Math.PI / 4       // Face northwest when moving northwest
  };
  return directionMap[dir] || 0;
};

export function MultiplayerController({ player, showDebug = false }: MultiplayerControllerProps) {
  // Initialize position based on movement state
  const getInitialPosition = () => {
    if (player.sourcePosition && player.targetPosition && player.movementStartTime) {
      const now = Date.now();
      const elapsed = (now - player.movementStartTime) / 1000;
      const dx = player.targetPosition.x - player.sourcePosition.x;
      const dz = player.targetPosition.z - player.sourcePosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const travelTime = distance / 15; // 15 units/second
      const progress = Math.min(1, elapsed / travelTime);
      
      if (progress >= 1) {
        return player.targetPosition;
      } else {
        return {
          x: player.sourcePosition.x + dx * progress,
          y: 0,
          z: player.sourcePosition.z + dz * progress
        };
      }
    }
    return player.position;
  };
  
  const [interpolatedPosition, setInterpolatedPosition] = useState(getInitialPosition());
  const [isPlayerMoving, setIsPlayerMoving] = useState(false);
  const [calculatedDirection, setCalculatedDirection] = useState(player.direction);
  const [debugInfo, setDebugInfo] = useState({
    progress: 0,
    distance: 0,
    speed: 0,
    frameCount: 0
  });
  
  const frameCountRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  
  // Update every frame for smooth movement
  useFrame(() => {
    frameCountRef.current++;
    
    if (player.sourcePosition && player.targetPosition && player.movementStartTime) {
      const now = Date.now();
      const elapsedMs = now - player.movementStartTime;
      const elapsedSeconds = elapsedMs / 1000;
      
      // Calculate total distance
      const dx = player.targetPosition.x - player.sourcePosition.x;
      const dz = player.targetPosition.z - player.sourcePosition.z;
      const totalDistance = Math.sqrt(dx * dx + dz * dz);
      
      // Check if this is essentially no movement (positions are the same)
      if (totalDistance < 0.01) {
        // Player is stationary - no movement needed
        setInterpolatedPosition(player.targetPosition);
        setIsPlayerMoving(false);
        return;
      }
      
      // Time to travel at 0.25 units/frame = 15 units/second at 60fps
      // MUST match the moveSpeed in RunescapeWorld.tsx exactly!
      const moveSpeed = 15; // units per second
      const totalTravelTime = totalDistance / moveSpeed;
      
      // No buffer - we want immediate response
      const progress = Math.min(1, elapsedSeconds / totalTravelTime);
      
      // CRITICAL: Handle late-joining scenarios
      // If we joined after movement started, we might have progress > 1
      if (progress >= 1) {
        // Player has already arrived (or we joined late)
        setInterpolatedPosition(player.targetPosition);
        setIsPlayerMoving(false);
        
        // Log completion
        if (frameCountRef.current % 10 === 0) {
          console.log(`[MP-COMPLETE] ${player.name} at destination (progress: ${(progress * 100).toFixed(1)}%)`);
        }
      } else {
        // Player is still moving - linear interpolation for predictable movement
        const newPosition = {
          x: player.sourcePosition.x + dx * progress,
          y: 0,
          z: player.sourcePosition.z + dz * progress
        };
        
        setInterpolatedPosition(newPosition);
        setIsPlayerMoving(true);
        
        // Calculate direction from movement vector
        const angle = Math.atan2(dx, dz);
        const normalized = ((angle + Math.PI) / (2 * Math.PI)) * 8;
        const index = Math.round(normalized) % 8;
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        setCalculatedDirection(directions[index]);
        
        // Update debug info
        const deltaTime = (now - lastUpdateRef.current) / 1000;
        const instantSpeed = deltaTime > 0 ? 
          Math.sqrt(
            Math.pow(newPosition.x - interpolatedPosition.x, 2) + 
            Math.pow(newPosition.z - interpolatedPosition.z, 2)
          ) / deltaTime : 0;
        
        setDebugInfo({
          progress: progress * 100,
          distance: totalDistance,
          speed: instantSpeed,
          frameCount: frameCountRef.current
        });
        
        // Log movement every 10 frames for detailed debugging
        if (frameCountRef.current % 10 === 0) {
          console.log(`[MP-FRAME] ${player.name} @ frame ${frameCountRef.current}:`, {
            from: `(${player.sourcePosition.x.toFixed(2)}, ${player.sourcePosition.z.toFixed(2)})`,
            to: `(${player.targetPosition.x.toFixed(2)}, ${player.targetPosition.z.toFixed(2)})`,
            current: `(${newPosition.x.toFixed(2)}, ${newPosition.z.toFixed(2)})`,
            progress: `${(progress * 100).toFixed(1)}%`,
            elapsed: `${elapsedSeconds.toFixed(2)}s`,
            totalTime: `${totalTravelTime.toFixed(2)}s`,
            speed: `${instantSpeed.toFixed(1)} u/s`,
            dir: calculatedDirection,
            distance: `${totalDistance.toFixed(2)} units`
          });
        }
      }
      
      lastUpdateRef.current = now;
    } else {
      // No movement data - use static position
      setInterpolatedPosition(player.position);
      setIsPlayerMoving(false);
    }
  });
  
  // Convert direction string to rotation angle for OtherPlayerOptimized
  const rotationAngle = getRotationFromDirection(calculatedDirection);
  
  return (
    <group>
      <OtherPlayerOptimized
        position={interpolatedPosition}
        direction={rotationAngle}
        isMoving={isPlayerMoving}
        isMovingAnim={isPlayerMoving}
        animPhase={0}
        modelFile={`${player.modelType}`}
        username={player.name}
        lastUpdate={player.lastUpdate}
        chatMessage={player.chatMessage}
        chatMessageTime={player.chatTimestamp}
      />
      
      {/* Debug overlay */}
      {showDebug && (
        <Html position={[interpolatedPosition.x, 25, interpolatedPosition.z]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '5px',
            borderRadius: '5px',
            fontSize: '10px',
            fontFamily: 'monospace',
            whiteSpace: 'pre'
          }}>
            {`${player.name}
━━━━━━━━━━━━━━━━
Pos: (${interpolatedPosition.x.toFixed(2)}, ${interpolatedPosition.z.toFixed(2)})
Target: (${player.targetPosition ? `${player.targetPosition.x.toFixed(2)}, ${player.targetPosition.z.toFixed(2)}` : 'none'})
Source: (${player.sourcePosition ? `${player.sourcePosition.x.toFixed(2)}, ${player.sourcePosition.z.toFixed(2)}` : 'none'})
Progress: ${debugInfo.progress.toFixed(1)}%
Distance: ${debugInfo.distance.toFixed(2)} units
Speed: ${debugInfo.speed.toFixed(1)} u/s
Moving: ${isPlayerMoving}
Dir: ${calculatedDirection}
Frame: ${debugInfo.frameCount}
Start: ${player.movementStartTime ? new Date(player.movementStartTime).toISOString().split('T')[1].split('.')[0] : 'none'}`}
          </div>
        </Html>
      )}
    </group>
  );
}