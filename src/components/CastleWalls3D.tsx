import React from 'react';
import * as THREE from 'three';

interface CastleWalls3DProps {
  width: number;
  height: number;
  position: [number, number, number];
  color: string;
}

// Perimeter walls around castle territory
function CastleWalls3D({ width, height, position, color }: CastleWalls3DProps) {
  const wallHeight = 12;
  const wallThickness = 2;
  const towerRadius = 3;
  const towerHeight = 16;
  
  // Calculate half dimensions for positioning
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  return (
    <group position={position}>
      {/* North Wall */}
      <mesh position={[0, wallHeight/2, -halfHeight]}>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* South Wall with Gate */}
      {/* Left part of south wall */}
      <mesh position={[-halfWidth/2 - 5, wallHeight/2, halfHeight]}>
        <boxGeometry args={[halfWidth - 10, wallHeight, wallThickness]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Right part of south wall */}
      <mesh position={[halfWidth/2 + 5, wallHeight/2, halfHeight]}>
        <boxGeometry args={[halfWidth - 10, wallHeight, wallThickness]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Gate arch */}
      <mesh position={[0, wallHeight - 2, halfHeight]}>
        <boxGeometry args={[10, 4, wallThickness]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* East Wall */}
      <mesh position={[halfWidth, wallHeight/2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, height]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* West Wall */}
      <mesh position={[-halfWidth, wallHeight/2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, height]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Corner Towers */}
      {[
        [-halfWidth, -halfHeight], // Northwest
        [halfWidth, -halfHeight],  // Northeast
        [-halfWidth, halfHeight],  // Southwest
        [halfWidth, halfHeight]    // Southeast
      ].map((pos, idx) => (
        <group key={idx} position={[pos[0], 0, pos[1]]}>
          {/* Tower base */}
          <mesh position={[0, towerHeight/2, 0]}>
            <cylinderGeometry args={[towerRadius, towerRadius * 1.2, towerHeight]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Tower top */}
          <mesh position={[0, towerHeight + 2, 0]}>
            <coneGeometry args={[towerRadius * 1.5, 4, 8]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          {/* Tower battlements */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * towerRadius;
            const z = Math.sin(angle) * towerRadius;
            return (
              <mesh key={i} position={[x, towerHeight + 1, z]}>
                <boxGeometry args={[0.8, 2, 0.8]} />
                <meshStandardMaterial color={color} />
              </mesh>
            );
          })}
        </group>
      ))}
      
      {/* Wall Battlements */}
      {/* North wall battlements */}
      {Array.from({ length: Math.floor(width / 3) }).map((_, i) => (
        <mesh key={`n-${i}`} position={[-halfWidth + 3 + i * 3, wallHeight + 0.5, -halfHeight]}>
          <boxGeometry args={[1.5, 1, wallThickness]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      
      {/* South wall battlements (avoiding gate area) */}
      {Array.from({ length: Math.floor((halfWidth - 10) / 3) }).map((_, i) => (
        <React.Fragment key={`s-${i}`}>
          <mesh position={[-halfWidth + 3 + i * 3, wallHeight + 0.5, halfHeight]}>
            <boxGeometry args={[1.5, 1, wallThickness]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[halfWidth - 3 - i * 3, wallHeight + 0.5, halfHeight]}>
            <boxGeometry args={[1.5, 1, wallThickness]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </React.Fragment>
      ))}
      
      {/* East/West wall battlements */}
      {Array.from({ length: Math.floor(height / 3) }).map((_, i) => (
        <React.Fragment key={`ew-${i}`}>
          <mesh position={[halfWidth, wallHeight + 0.5, -halfHeight + 3 + i * 3]}>
            <boxGeometry args={[wallThickness, 1, 1.5]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[-halfWidth, wallHeight + 0.5, -halfHeight + 3 + i * 3]}>
            <boxGeometry args={[wallThickness, 1, 1.5]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
}

export default CastleWalls3D;