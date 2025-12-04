import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { loadSkeletonArcher, SkeletonArcherData } from '../lib/SkeletonArcherLoader';

interface SkeletonArcherPlayerProps {
  initialPosition?: [number, number, number];
  onPositionChange?: (position: THREE.Vector3) => void;
  onAnimationChange?: (animation: string) => void;
}

/**
 * A fully controllable Skeleton Archer player character component.
 * Use WASD or arrow keys to move and control the character.
 */
const SkeletonArcherPlayer: React.FC<SkeletonArcherPlayerProps> = ({ 
  initialPosition = [0, 0, 0],
  onPositionChange,
  onAnimationChange
}) => {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [skeletonData, setSkeletonData] = useState<SkeletonArcherData | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  
  // Track keyboard inputs using a ref to avoid re-renders
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Load the skeleton archer model on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadCharacter = async () => {
      try {
        // Create a temporary scene for loading
        const tempScene = new THREE.Scene();
        const data = await loadSkeletonArcher(tempScene);
        
        if (isMounted && groupRef.current) {
          // Remove from temp scene and add to our group
          tempScene.remove(data.model);
          groupRef.current.add(data.model);
          
          // Set initial position
          groupRef.current.position.set(
            initialPosition[0],
            initialPosition[1],
            initialPosition[2]
          );
          
          // Store the loaded data
          setSkeletonData(data);
          
          // Start with idle animation
          data.playAnimation('idle');
          setCurrentAnimation('idle');
        }
      } catch (error) {
        console.error('Failed to load skeleton archer:', error);
      }
    };
    
    loadCharacter();
    
    // Setup keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Clean up the character model
      if (groupRef.current) {
        while (groupRef.current.children.length) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
      }
    };
  }, [initialPosition]);
  
  // Determine which animation to play based on keys pressed
  const determineAnimation = (): string => {
    const keys = keysPressed.current;
    const forward = keys.has('w') || keys.has('arrowup');
    const backward = keys.has('s') || keys.has('arrowdown');
    const left = keys.has('a') || keys.has('arrowleft');
    const right = keys.has('d') || keys.has('arrowright');
    
    if (keys.has(' ')) return 'jump';
    if (keys.has('shift')) return 'attack';
    
    if (forward || backward || left || right) {
      // If model has strafe animations, use them when moving sideways only
      if (skeletonData?.actions.has('strafe_left') && left && !forward && !backward) {
        return 'strafe_left';
      }
      if (skeletonData?.actions.has('strafe_right') && right && !forward && !backward) {
        return 'strafe_right';
      }
      return 'walk';
    }
    
    return 'idle';
  };
  
  // Determine rotation based on movement direction
  const determineRotation = (): number | null => {
    const keys = keysPressed.current;
    const forward = keys.has('w') || keys.has('arrowup');
    const backward = keys.has('s') || keys.has('arrowdown');
    const left = keys.has('a') || keys.has('arrowleft');
    const right = keys.has('d') || keys.has('arrowright');
    
    if (forward && left) return Math.PI / 4; // NW
    if (forward && right) return -Math.PI / 4; // NE
    if (backward && left) return (3 * Math.PI) / 4; // SW
    if (backward && right) return -(3 * Math.PI) / 4; // SE
    if (forward) return 0; // N
    if (backward) return Math.PI; // S
    if (left) return Math.PI / 2; // W
    if (right) return -Math.PI / 2; // E
    
    return null; // No change
  };
  
  // Animation and movement logic in the frame loop
  useFrame((state, delta) => {
    if (!groupRef.current || !skeletonData) return;
    
    // Update animation mixer
    skeletonData.mixer.update(delta);
    
    // Determine current animation based on input
    const animation = determineAnimation();
    
    // Update animation if changed
    if (animation !== currentAnimation) {
      skeletonData.playAnimation(animation);
      setCurrentAnimation(animation);
      
      // Notify parent component of animation change
      if (onAnimationChange) {
        onAnimationChange(animation);
      }
    }
    
    // Handle character rotation based on movement direction
    const rotation = determineRotation();
    if (rotation !== null && skeletonData.model) {
      skeletonData.model.rotation.y = rotation;
    }
    
    // Handle character movement
    const keys = keysPressed.current;
    if (keys.size > 0 && skeletonData.model) {
      const speed = 5; // Units per second
      
      // Get movement direction from character's rotation
      const angle = skeletonData.model.rotation.y;
      const xDir = Math.sin(-angle);
      const zDir = Math.cos(angle);
      
      // Apply movement based on pressed keys
      if (keys.has('w') || keys.has('arrowup')) {
        groupRef.current.position.x += xDir * speed * delta;
        groupRef.current.position.z -= zDir * speed * delta;
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        groupRef.current.position.x -= xDir * speed * delta;
        groupRef.current.position.z += zDir * speed * delta;
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        groupRef.current.position.x -= zDir * speed * delta;
        groupRef.current.position.z -= xDir * speed * delta;
      }
      if (keys.has('d') || keys.has('arrowright')) {
        groupRef.current.position.x += zDir * speed * delta;
        groupRef.current.position.z += xDir * speed * delta;
      }
      
      // Notify parent component of position change
      if (onPositionChange) {
        onPositionChange(groupRef.current.position);
      }
    }
  });
  
  /**
   * Public method to trigger a specific animation
   */
  const playAnimation = (animationName: string): boolean => {
    if (!skeletonData) return false;
    const success = skeletonData.playAnimation(animationName);
    if (success) {
      setCurrentAnimation(animationName);
    }
    return success;
  };
  
  /**
   * Public method to move to a specific position
   */
  const moveTo = (position: [number, number, number]) => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  };
  
  // Expose methods to parent via React refs
  React.useImperativeHandle(
    React.forwardRef((props, ref) => ref),
    () => ({
      playAnimation,
      moveTo,
      getCurrentAnimation: () => currentAnimation,
      getPosition: () => groupRef.current?.position.clone() || new THREE.Vector3(),
    })
  );
  
  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Character model will be added here by the useEffect */}
    </group>
  );
};

export default React.memo(SkeletonArcherPlayer);