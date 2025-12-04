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
    direction: string;
    modelType: string;
    lastUpdate: number;
    chatMessage?: string;
    chatTimestamp?: number;
    positionBuffer?: Array<{
      position: { x: number; y: number; z: number };
      timestamp: number;
    }>;
  };
  showDebug?: boolean;
}

// Convert direction string to rotation angle
const getRotationFromDirection = (dir: string): number => {
  const directionMap: { [key: string]: number } = {
    'N': 0,
    'NE': -Math.PI / 4,
    'E': -Math.PI / 2,
    'SE': -3 * Math.PI / 4,
    'S': Math.PI,
    'SW': 3 * Math.PI / 4,
    'W': Math.PI / 2,
    'NW': Math.PI / 4
  };
  return directionMap[dir] || 0;
};

export function BufferedMultiplayerController({ player, showDebug = false }: MultiplayerControllerProps) {
  // State for interpolated position
  const [renderPosition, setRenderPosition] = useState(player.position);
  const [isPlayerMoving, setIsPlayerMoving] = useState(false);
  const [calculatedDirection, setCalculatedDirection] = useState(player.direction);
  const [debugInfo, setDebugInfo] = useState({
    renderDelay: 0,
    bufferSize: 0,
    interpolationProgress: 0,
    speed: 0,
    frameCount: 0
  });
  
  // Refs for frame-based updates
  const frameCountRef = useRef(0);
  const renderDelayMs = 100; // 100ms render delay for smooth interpolation
  
  // Store interpolation state with proper time tracking
  const interpolationStateRef = useRef({
    startPos: player.position,
    targetPos: player.position,
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    isInterpolating: false
  });
  
  // Always ensure player has a valid position - they're permanent fixtures!
  useEffect(() => {
    // Use any available position - players should ALWAYS be visible
    const position = player.targetPosition || player.sourcePosition || player.position;
    
    if (!position) {
      console.error(`[BufferedMP] Player ${player.name} has NO POSITION! This should never happen!`);
      return;
    }
    
    // Always set a position - players are furniture in the world
    setRenderPosition(position);
    
    // Check if moving (only if we have both positions)
    if (player.sourcePosition && player.targetPosition) {
      const dx = player.targetPosition.x - player.sourcePosition.x;
      const dz = player.targetPosition.z - player.sourcePosition.z;
      const isMoving = Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01;
      
      setIsPlayerMoving(isMoving);
      
      if (isMoving) {
        // Calculate direction
        const angle = Math.atan2(dx, dz);
        const normalized = ((angle + Math.PI) / (2 * Math.PI)) * 8;
        const index = Math.round(normalized) % 8;
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        setCalculatedDirection(directions[index]);
      }
    } else {
      // Not moving - just standing still (which is fine!)
      setIsPlayerMoving(false);
    }
    
    console.log(`[BufferedMP] Player ${player.name} positioned at:`, {
      x: position.x.toFixed(1),
      z: position.z.toFixed(1),
      moving: isPlayerMoving
    });
  }, [player.sourcePosition, player.targetPosition, player.position, player.name, isPlayerMoving]);

  // Simple frame counter for logging
  useFrame(() => {
    frameCountRef.current++;
  });

  // Convert direction string to rotation angle
  const rotationAngle = getRotationFromDirection(calculatedDirection);

  return (
    <group>
      <OtherPlayerOptimized
        position={renderPosition}
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
        <Html position={[renderPosition.x, 25, renderPosition.z]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#00ff00',
            padding: '8px',
            borderRadius: '5px',
            fontSize: '11px',
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            border: '1px solid #00ff00'
          }}>
            {`=== ${player.name} ===
Pos: (${renderPosition.x.toFixed(1)}, ${renderPosition.z.toFixed(1)})
Delay: ${debugInfo.renderDelay}ms
Progress: ${debugInfo.interpolationProgress.toFixed(1)}%
Speed: ${debugInfo.speed} u/s
Moving: ${isPlayerMoving}
Dir: ${calculatedDirection}
Buffer: ${debugInfo.bufferSize} positions
Frame: ${debugInfo.frameCount}`}
          </div>
        </Html>
      )}
    </group>
  );
}