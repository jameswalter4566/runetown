import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, Grid, Stats } from '@react-three/drei';
import * as THREE from 'three';
import SkeletonArcherPlayer from './SkeletonArcherPlayer';

// Interface for component props
interface SkeletonArcherPlayerDemoProps {
  enableDebug?: boolean;
  showControls?: boolean;
  environmentPreset?: 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby';
}

/**
 * Demo component showcasing the SkeletonArcherPlayer with environmental controls
 */
const SkeletonArcherPlayerDemo: React.FC<SkeletonArcherPlayerDemoProps> = ({ 
  enableDebug = false,
  showControls = true,
  environmentPreset = 'forest'
}) => {
  // Store the current position and animation for UI display
  const [playerPosition, setPlayerPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  
  // Reference to the skeleton archer player component for external control
  const playerRef = useRef<any>(null);
  
  // Handle position changes from the player
  const handlePositionChange = (position: THREE.Vector3) => {
    setPlayerPosition(position);
  };
  
  // Handle animation changes from the player
  const handleAnimationChange = (animation: string) => {
    setCurrentAnimation(animation);
  };
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Three.js Canvas */}
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        {/* Add Orbit Controls for camera manipulation */}
        <OrbitControls target={[0, 0.5, 0]} maxPolarAngle={Math.PI / 2 - 0.1} />
        
        {/* Environment lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Sky backdrop */}
        <Sky sunPosition={[10, 10, 0]} />
        
        {/* Environment map for realistic reflections */}
        <Environment preset={environmentPreset} />
        
        {/* Ground plane with grid for visual reference */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]} 
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#5a8a47" />
        </mesh>
        <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />
        
        {/* Skeleton Archer Player Character */}
        <SkeletonArcherPlayer 
          ref={playerRef}
          initialPosition={[0, 0, 0]}
          onPositionChange={handlePositionChange}
          onAnimationChange={handleAnimationChange}
        />
        
        {/* Show performance stats if debug enabled */}
        {enableDebug && <Stats />}
      </Canvas>
      
      {/* Control UI Overlay */}
      {showControls && (
        <>
          {/* Controls Info */}
          <div style={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            color: 'white', 
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px',
            maxWidth: '300px'
          }}>
            <h3 style={{ margin: 0, marginBottom: '10px' }}>Skeleton Archer Controls</h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>W/↑: Move forward</li>
              <li>S/↓: Move backward</li>
              <li>A/←: Move left</li>
              <li>D/→: Move right</li>
              <li>Space: Jump</li>
              <li>Shift: Attack</li>
            </ul>
            <p style={{ margin: 0, marginTop: '10px' }}>
              Use mouse to orbit camera
            </p>
          </div>
          
          {/* Debug Info */}
          {enableDebug && (
            <div style={{ 
              position: 'absolute', 
              bottom: 10, 
              left: 10, 
              color: 'white', 
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '10px',
              borderRadius: '5px',
              fontFamily: 'monospace'
            }}>
              <div>Animation: {currentAnimation}</div>
              <div>Position: X:{playerPosition.x.toFixed(2)} Y:{playerPosition.y.toFixed(2)} Z:{playerPosition.z.toFixed(2)}</div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div style={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            <button 
              onClick={() => playerRef.current?.playAnimation('idle')}
              style={{ padding: '5px 10px' }}
            >
              Idle
            </button>
            <button 
              onClick={() => playerRef.current?.playAnimation('walk')}
              style={{ padding: '5px 10px' }}
            >
              Walk
            </button>
            <button 
              onClick={() => playerRef.current?.playAnimation('attack')}
              style={{ padding: '5px 10px' }}
            >
              Attack
            </button>
            <button 
              onClick={() => playerRef.current?.moveTo([0, 0, 0])}
              style={{ padding: '5px 10px' }}
            >
              Reset Position
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SkeletonArcherPlayerDemo;