import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BodyTypeBCharacter } from '../components/BodyTypeBCharacter';

const CharacterBTest: React.FC = () => {
  const [isWalking, setIsWalking] = useState(false);
  const [scale, setScale] = useState(50);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#87CEEB' }}>
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        zIndex: 10, 
        background: 'rgba(255, 255, 255, 0.9)', 
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>Character B Test Page</h1>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={isWalking} 
              onChange={(e) => setIsWalking(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
            Walking Animation
          </label>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Scale: {scale}
          </label>
          <input 
            type="range" 
            min="10" 
            max="200" 
            value={scale} 
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ width: '200px' }}
          />
        </div>
        
        <div style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
          <p>• Use mouse to orbit around the character</p>
          <p>• Scroll to zoom in/out</p>
          <p>• Edit BodyTypeBCharacter.tsx to see changes</p>
        </div>
      </div>

      <Canvas camera={{ position: [0, 100, 200], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        
        <BodyTypeBCharacter 
          position={[0, 0, 0]}
          scale={scale}
          isWalking={isWalking}
        />
        
        <gridHelper args={[1000, 50]} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 50, 0]}
        />
      </Canvas>
    </div>
  );
};

export default CharacterBTest;