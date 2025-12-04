import React, { useRef, useState, useEffect } from 'react';
import { Box, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WalkingDogNPCDebugProps {
  scale?: number;
  yPosition?: number;
}

export const WalkingDogNPCDebug: React.FC<WalkingDogNPCDebugProps> = ({ 
  scale: initialScale = 5,
  yPosition: initialY = 7.5
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(initialScale);
  const [yPosition, setYPosition] = useState(initialY);
  const [radius, setRadius] = useState(20);
  const [rotationSpeed, setRotationSpeed] = useState(0.02);
  const [showControls, setShowControls] = useState(true);
  
  // Movement state
  const centerX = 0;
  const centerZ = 0;
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [currentPos, setCurrentPos] = useState({ x: 0, y: initialY, z: 0 });
  
  // Update movement
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update position - move in a circle
    angleRef.current += rotationSpeed;
    const x = centerX + Math.cos(angleRef.current) * radius;
    const z = centerZ + Math.sin(angleRef.current) * radius;
    
    groupRef.current.position.set(x, yPosition, z);
    setCurrentPos({ x, y: yPosition, z });
    
    // Face the direction of movement
    const nextAngle = angleRef.current + rotationSpeed;
    const nextX = centerX + Math.cos(nextAngle) * radius;
    const nextZ = centerZ + Math.sin(nextAngle) * radius;
    
    const direction = new THREE.Vector3(nextX - x, 0, nextZ - z).normalize();
    const angle = Math.atan2(direction.x, direction.z);
    groupRef.current.rotation.y = angle;
  });

  return (
    <>
      <group ref={groupRef}>
        {/* Debug cube representing the dog */}
        <Box args={[scale, scale, scale * 2]}>
          <meshStandardMaterial color="brown" />
        </Box>
        
        {/* Add a head */}
        <Box args={[scale * 0.6, scale * 0.6, scale * 0.8]} position={[0, scale * 0.3, scale * 0.9]}>
          <meshStandardMaterial color="#8B4513" />
        </Box>
        
        {/* Add a tail */}
        <Box args={[scale * 0.2, scale * 0.2, scale * 0.8]} position={[0, scale * 0.2, -scale * 1.1]}>
          <meshStandardMaterial color="#654321" />
        </Box>
        
        {/* Label */}
        <Html position={[0, scale + 2, 0]} center>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'black',
            whiteSpace: 'nowrap'
          }}>
            DOG NPC DEBUG
          </div>
        </Html>
      </group>
      
      {/* Debug Controls UI */}
      {showControls && (
        <Html position={[50, 20, 0]} style={{ width: '300px' }}>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Dog NPC Debug Controls</h3>
            
            <div style={{ marginBottom: '8px' }}>
              <strong>Position:</strong><br/>
              X: {currentPos.x.toFixed(2)}, Y: {currentPos.y.toFixed(2)}, Z: {currentPos.z.toFixed(2)}
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label>Scale: {scale.toFixed(1)}</label><br/>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="0.5"
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label>Y Position: {yPosition.toFixed(1)}</label><br/>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="0.5"
                value={yPosition} 
                onChange={(e) => setYPosition(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label>Radius: {radius.toFixed(1)}</label><br/>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="1"
                value={radius} 
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label>Speed: {rotationSpeed.toFixed(3)}</label><br/>
              <input 
                type="range" 
                min="0" 
                max="0.1" 
                step="0.001"
                value={rotationSpeed} 
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <button 
              onClick={() => setShowControls(false)}
              style={{ 
                marginTop: '10px',
                padding: '5px 10px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Hide Controls
            </button>
          </div>
        </Html>
      )}
      
      {!showControls && (
        <Html position={[50, 20, 0]}>
          <button 
            onClick={() => setShowControls(true)}
            style={{ 
              padding: '5px 10px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Show Dog Debug
          </button>
        </Html>
      )}
    </>
  );
};