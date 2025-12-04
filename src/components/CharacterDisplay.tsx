import React from 'react';
import { CharacterType, FactionType } from '@/types/game';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Knight } from './characters/Knight';
import { Goblin } from './characters/Goblin';
import { Dragon } from './characters/Dragon';
import { Wizard } from './characters/Wizard';
import { Elf } from './characters/Elf';
import { SkeletonArcher } from './characters/SkeletonArcher';

interface CharacterDisplayProps {
  character: CharacterType | FactionType;
  size?: number;
}

// Character preview component for display
function Character3DPreview({ character }: { character: CharacterType | FactionType }) {
  const characterRef = React.useRef<Knight | Goblin | Dragon | Wizard | Elf | SkeletonArcher>();
  const groupRef = React.useRef<THREE.Group>(null);
  const [hasSkeletonArcher, setHasSkeletonArcher] = React.useState(false);
  const [hasWizard, setHasWizard] = React.useState(false);

  React.useEffect(() => {
    if (!groupRef.current) return;
    
    let char: Knight | Goblin | Dragon | Wizard | Elf | SkeletonArcher;
    
    // Handle both CharacterType and FactionType
    switch (character) {
      case 'knight':
      case 'knights':
        char = new Knight();
        setHasSkeletonArcher(false);
        setHasWizard(false);
        break;
      case 'goblin':
      case 'goblins':
        char = new Goblin();
        setHasSkeletonArcher(false);
        setHasWizard(false);
        break;
      case 'king':
      case 'dragons':
        char = new Dragon();
        setHasSkeletonArcher(false);
        setHasWizard(false);
        break;
      case 'queen':
      case 'wizards':
        char = new Wizard();
        setHasSkeletonArcher(false);
        setHasWizard(true);
        break;
      case 'elves':
        char = new Elf();
        setHasSkeletonArcher(false);
        setHasWizard(false);
        break;
      case 'custom':
        char = new SkeletonArcher();
        setHasSkeletonArcher(true);
        setHasWizard(false);
        break;
      default:
        char = new Knight();
        setHasSkeletonArcher(false);
        setHasWizard(false);
    }
    
    // Apply scaling and start animations
    char.group.scale.set(0.8, 0.8, 0.8);
    char.group.rotation.y = -Math.PI / 4;
    char.group.position.set(0, -8, 26);
    
    // Start animations for characters that support them
    if (char instanceof SkeletonArcher) {
      console.log('SkeletonArcher detected in preview, starting animation');
      char.play();
    } else if (char instanceof Wizard) {
      console.log('Wizard detected in preview, starting animation');
      char.play();
    }
    
    groupRef.current.add(char.group);
    characterRef.current = char;
    
    return () => {
      if (groupRef.current && char.group) {
        groupRef.current.remove(char.group);
      }
    };
  }, [character]);

  // Update animations in the render loop
  React.useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      if (characterRef.current) {
        if (hasSkeletonArcher) {
          // Update SkeletonArcher animations
          (characterRef.current as SkeletonArcher).update();
        } else if (hasWizard) {
          // Update Wizard animations
          (characterRef.current as Wizard).update();
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasSkeletonArcher, hasWizard]);

  return <group ref={groupRef} />;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ character, size = 100 }) => {

  const getCharacterColor = () => {
    switch (character) {
      case 'knight':
      case 'knights':
        return '#C0C0C0';
      case 'king':
      case 'dragons':
        return '#FF4500';
      case 'queen':
      case 'wizards':
        return '#4B0082';
      case 'goblin':
      case 'goblins':
        return '#228B22';
      case 'elves':
        return '#20B2AA';
      case 'custom':
        return '#9932CC'; // Purple color for Skeleton Archers
      default:
        return '#666666';
    }
  };

  // Add a rotation effect for the character preview
  const RotationEffect = () => {
    const { scene } = useThree();
    React.useEffect(() => {
      let frameId: number;
      const animate = () => {
        if (character === 'custom') {
          // Slower rotation for Skeleton Archer
          scene.rotation.y += 0.005;
        } else {
          // Normal rotation for other characters
          scene.rotation.y += 0.01;
        }
        frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    }, [scene, character]);
    return null;
  };
  
  return (
    <div 
      className="rounded-lg shadow-md overflow-hidden"
      style={{
        width: size,
        height: size,
        backgroundColor: getCharacterColor() + '20',
        border: `3px solid ${getCharacterColor()}`
      }}
    >
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Character3DPreview character={character} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={character !== 'custom'} />
        {character === 'custom' && <RotationEffect />}
      </Canvas>
    </div>
  );
};

export default CharacterDisplay;