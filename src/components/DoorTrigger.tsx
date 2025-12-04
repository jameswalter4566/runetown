import React, { useState } from 'react';
import * as THREE from 'three';

interface DoorTriggerProps {
  position: [number, number, number];
  size: [number, number, number];
  onClick: () => void;
}

export function DoorTrigger({ position, size, onClick }: DoorTriggerProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial
        color={hovered ? "yellow" : "white"}
        transparent
        opacity={hovered ? 0.3 : 0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}