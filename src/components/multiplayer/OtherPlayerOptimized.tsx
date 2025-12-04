import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html, useAnimations, Box } from '@react-three/drei';
import * as THREE from 'three';

interface OtherPlayerProps {
  position: { x: number; y: number; z: number };
  direction: number;
  isMoving: boolean;
  isMovingAnim: boolean;
  animPhase: number;
  modelFile: string;
  username: string;
  lastUpdate: number;
  onClick?: () => void;
  marketCap?: number;
  messages?: Array<{ id: string; text: string; timestamp: number; penguinName: string; penguinColor: string }>;
  chatMessage?: string;
  chatMessageTime?: number;
}

export function OtherPlayerOptimized({ 
  position, 
  direction,
  isMoving,
  isMovingAnim,
  animPhase,
  modelFile = 'blue_blue_white.glb',
  username,
  lastUpdate,
  onClick,
  marketCap = 4200,
  messages = [],
  chatMessage,
  chatMessageTime
}: OtherPlayerProps) {
  // Force re-render every second to update chat message visibility
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (chatMessage && chatMessageTime) {
      const interval = setInterval(() => {
        forceUpdate(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [chatMessage, chatMessageTime]);
  // Debug what props we're receiving
  useEffect(() => {
    if (chatMessage || chatMessageTime) {
      console.log(`🎯 OtherPlayerOptimized props for ${username}:`, {
        chatMessage,
        chatMessageTime,
        hasChatMessage: !!chatMessage,
        hasChatTime: !!chatMessageTime
      });
    }
  }, [chatMessage, chatMessageTime, username]);
  
  const groupRef = useRef<THREE.Group>(null);
  
  // Ensure the model path is correct
  const modelPath = modelFile.startsWith('/') ? modelFile : `/models/${modelFile}`;
  
  // Preload the model before using it
  useEffect(() => {
    useGLTF.preload(modelPath);
  }, [modelPath]);
  
  const { scene, animations } = useGLTF(modelPath);
  const [modelReady, setModelReady] = useState(false);
  
  // Log when chat message changes
  useEffect(() => {
    if (chatMessage) {
      console.log(`💬 Chat bubble update for ${username}: "${chatMessage}" at time ${chatMessageTime}`);
      console.log(`Time remaining: ${5000 - (Date.now() - (chatMessageTime || 0))}ms`);
    }
  }, [chatMessage, chatMessageTime, username]);
  
  // Ensure Pixelify Sans font is loaded
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  
  // Clone animations to ensure each player has unique instances
  const clonedAnimations = useMemo(() => {
    if (!animations || animations.length === 0) return [];
    return animations.map(clip => clip.clone());
  }, [animations]);
  
  // Setup animations with cloned animations
  const { mixer, actions } = useAnimations(clonedAnimations, groupRef);
  
  // Load fallback animations if custom model has no animations
  const [fallbackAnimations, setFallbackAnimations] = useState<THREE.AnimationClip[]>([]);
  const [needsFallback, setNeedsFallback] = useState(false);
  
  // State for smooth animations
  const animationStateRef = useRef({
    currentDirection: direction
  });
  
  // Direct position and rotation updates - no interpolation needed
  // as it's handled by the RemotePlayerController
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // REMOVED: Position setting moved to parent component to allow interpolation
    // The BufferedMultiplayerController passes interpolated positions as props
    
    // Smooth rotation interpolation
    const rotationSpeed = 5; // radians per second
    const angleDiff = ((direction - animationStateRef.current.currentDirection + Math.PI) % (2 * Math.PI)) - Math.PI;
    animationStateRef.current.currentDirection += angleDiff * Math.min(1, rotationSpeed * delta);
    groupRef.current.rotation.y = animationStateRef.current.currentDirection;
    
    // Update mixer for animations
    if (mixer) {
      mixer.update(delta);
    }
  });
  
  // Setup scene
  useEffect(() => {
    if (!scene) return;
    
    // Setup shadows for all meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.visible = true;
      }
    });
    
    setModelReady(true);
  }, [scene]);
  
  // Check if we need fallback animations
  useEffect(() => {
    if (!modelReady) return;
    
    if (animations.length === 0 && modelFile !== 'player.glb') {
      console.log('Other player custom model has no animations, will load from player.glb');
      setNeedsFallback(true);
    } else {
      setNeedsFallback(false);
    }
  }, [modelReady, animations.length, modelFile]);
  
  // Load fallback animations if needed
  useEffect(() => {
    if (needsFallback) {
      import('three/examples/jsm/loaders/GLTFLoader').then(({ GLTFLoader }) => {
        const loader = new GLTFLoader();
        loader.load('/models/player.glb', (gltf) => {
          if (gltf.animations.length > 0) {
            console.log('Loaded fallback animations for other player:', gltf.animations.length);
            setFallbackAnimations(gltf.animations);
          }
        });
      });
    }
  }, [needsFallback]);
  
  // Setup fallback animations if needed
  const { mixer: fallbackMixer, actions: fallbackActions } = useAnimations(
    needsFallback ? fallbackAnimations : [],
    groupRef
  );
  
  // Use whichever animations are available
  const effectiveActions = (actions && Object.keys(actions).length > 0) ? actions : fallbackActions;
  const effectiveMixer = (actions && Object.keys(actions).length > 0) ? mixer : fallbackMixer;
  
  // Update fallback mixer if it's being used
  useFrame((state, delta) => {
    if (!mixer && fallbackMixer) {
      fallbackMixer.update(delta);
    }
  });
  
  // Handle animation based on movement state
  useEffect(() => {
    if (!modelReady) return;
    
    if (!effectiveActions || Object.keys(effectiveActions).length === 0) {
      return;
    }
    
    // Get all available animations
    const animationNames = Object.keys(effectiveActions);
    if (animationNames.length === 0) return;
    
    // Use the first available animation (walking animation)
    const walkAnimation = effectiveActions[animationNames[0]];
    if (!walkAnimation) return;
    
    // Play or stop animation based on movement
    if (isMoving) {
      walkAnimation.reset().fadeIn(0.05).play();
    } else {
      walkAnimation.fadeOut(0.1);
    }
  }, [isMoving, effectiveActions, modelReady]);
  
  // Check if player is stale
  const isStale = Date.now() - lastUpdate > 5000;
  
  // Cleanup animation mixer and dispose model on unmount
  useEffect(() => {
    return () => {
      // Stop all animations
      if (mixer) {
        mixer.stopAllAction();
        if (groupRef.current) {
          mixer.uncacheRoot(groupRef.current);
        }
      }
      if (fallbackMixer && fallbackMixer !== mixer) {
        fallbackMixer.stopAllAction();
        if (groupRef.current) {
          fallbackMixer.uncacheRoot(groupRef.current);
        }
      }
      
      // Dispose of the model to free memory
      if (scene) {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [mixer, fallbackMixer, scene]);
  
  // Handle cursor
  const handlePointerOver = () => {
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
  };
  
  // Validation logging
  useEffect(() => {
    console.log('👤 Other Player State:', {
      username,
      modelReady,
      hasScene: !!scene,
      position: `(${position.x?.toFixed(1) || 0}, ${position.y?.toFixed(1) || 0}, ${position.z?.toFixed(1) || 0})`,
      chatMessage: chatMessage,
      chatMessageTime: chatMessageTime,
      shouldShowChat: chatMessage && chatMessageTime && (Date.now() - chatMessageTime < 5000),
      isMoving,
      modelFile,
      isStale
    });
  }, [username, modelReady, scene, isStale]);
  
  // Dedicated chat message logging
  useEffect(() => {
    if (chatMessage) {
      const timeDiff = Date.now() - (chatMessageTime || 0);
      const shouldShow = chatMessage && chatMessageTime && timeDiff < 5000;
      console.log(`💬 CHAT RENDER CHECK for ${username}:`, {
        message: chatMessage,
        chatMessageTime,
        currentTime: Date.now(),
        timeDiff,
        shouldShow,
        willRender: shouldShow ? 'YES' : 'NO'
      });
    }
  }, [chatMessage, chatMessageTime, username]);

  if (!scene || !modelReady) {
    console.warn('⚠️ Other player not ready:', username, { modelReady, hasScene: !!scene, modelFile });
    return (
      <group position={[position.x || 0, position.y || 1, position.z || 0]}>
        <Box args={[5, 10, 5]} position={[0, 5, 0]}>
          <meshStandardMaterial color="yellow" wireframe />
        </Box>
        <Html position={[0, 12, 0]} center>
          <div style={{ color: 'white', background: 'black', padding: '2px 5px', borderRadius: '3px' }}>
            {username} (Loading...)
          </div>
        </Html>
      </group>
    );
  }

  return (
    <group 
      ref={groupRef}
      position={[position.x || 0, position.y || 0, position.z || 0]}
      onClick={onClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive object={scene} scale={[50, 50, 50]} position={[0, 3, 26]} />
      
      {/* Show either chat message or username */}
      <Html 
        position={[0, 17, 0]} 
        center
        style={{
          fontSize: '14px',
          opacity: isStale ? 0.5 : 1
        }}
      >
        <div style={{
          color: isStale ? 'gray' : 'yellow',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none'
        }}>
          {chatMessage && chatMessageTime && Date.now() - chatMessageTime < 5000 
            ? chatMessage 
            : (username + (isStale ? ' (disconnected)' : ''))}
        </div>
      </Html>
    </group>
  );
}

// Preload common character models
const CHARACTER_MODELS = [
  'blue_blue_white.glb',
  'player.glb'
];

CHARACTER_MODELS.forEach(model => {
  useGLTF.preload(`/models/${model}`);
});