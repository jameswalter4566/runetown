import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { OtherPlayerOptimized } from './OtherPlayerOptimized';

interface PlayerData {
  id: string;
  position: { x: number; y: number; z: number };
  direction: number;
  isMoving: boolean;
  isMovingAnim: boolean;
  animPhase: number;
  modelFile: string;
  username: string;
  lastUpdate?: number;
  chatMessage?: string;
  chatMessageTime?: number;
}

interface PlayerRendererProps {
  players: PlayerData[];
  renderDistance?: number;
  maxVisiblePlayers?: number;
}

// Optimized player renderer that can handle 400+ concurrent players
export function PlayerRenderer({ 
  players, 
  renderDistance = 200,
  maxVisiblePlayers = 100 
}: PlayerRendererProps) {
  const cameraRef = useRef<THREE.Camera>();
  const [visiblePlayers, setVisiblePlayers] = React.useState<PlayerData[]>([]);

  // Get camera reference
  useFrame(({ camera }) => {
    cameraRef.current = camera;
  });

  // Optimize visible players based on distance from camera
  useEffect(() => {
    if (!cameraRef.current) return;

    const updateVisiblePlayers = () => {
      const camera = cameraRef.current!;
      const cameraPos = camera.position;

      // Sort players by distance from camera
      const sortedPlayers = [...players].sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(a.position.x - cameraPos.x, 2) +
          Math.pow(a.position.z - cameraPos.z, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.position.x - cameraPos.x, 2) +
          Math.pow(b.position.z - cameraPos.z, 2)
        );
        return distA - distB;
      });

      // Filter by render distance and max visible count
      const visible = sortedPlayers
        .filter(player => {
          const dist = Math.sqrt(
            Math.pow(player.position.x - cameraPos.x, 2) +
            Math.pow(player.position.z - cameraPos.z, 2)
          );
          return dist <= renderDistance;
        })
        .slice(0, maxVisiblePlayers);

      setVisiblePlayers(visible);
    };

    // Update visible players every 500ms to reduce computation
    const interval = setInterval(updateVisiblePlayers, 500);
    updateVisiblePlayers(); // Initial update

    return () => clearInterval(interval);
  }, [players, renderDistance, maxVisiblePlayers]);

  // Memoize player components to prevent unnecessary re-renders
  const playerComponents = useMemo(() => {
    return visiblePlayers.map((player) => (
      <OtherPlayerOptimized
        key={player.id}
        position={player.position}
        direction={player.direction}
        isMoving={player.isMoving}
        isMovingAnim={player.isMovingAnim}
        animPhase={player.animPhase}
        modelFile={player.modelFile}
        username={player.username}
        lastUpdate={player.lastUpdate || Date.now()}
        chatMessage={player.chatMessage}
        chatMessageTime={player.chatMessageTime}
      />
    ));
  }, [visiblePlayers]);

  return (
    <>
      {playerComponents}
      {/* Show player count info */}
      {players.length > maxVisiblePlayers && (
        <group>
          <Html position={[0, 20, 0]} center>
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '12px'
            }}>
              Showing {visiblePlayers.length} of {players.length} players
            </div>
          </Html>
        </group>
      )}
    </>
  );
}