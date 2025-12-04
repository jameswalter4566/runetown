import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Test component to debug player model loading
function PlayerModelTester({ modelPath }: { modelPath: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('Loading...');
  const [modelInfo, setModelInfo] = useState<any>(null);
  
  try {
    const { scene, animations } = useGLTF(modelPath);
    const { mixer, actions } = useAnimations(animations, groupRef);
    
    useEffect(() => {
      if (!scene) {
        setLoadingStatus('No scene data');
        return;
      }
      
      console.log('=== MODEL LOADING DEBUG ===');
      console.log('Model path:', modelPath);
      console.log('Scene object:', scene);
      console.log('Animations:', animations);
      
      // Analyze the model structure
      let meshCount = 0;
      let materialCount = 0;
      const meshes: any[] = [];
      const materials: any[] = [];
      
      scene.traverse((child) => {
        console.log('Child found:', child.name, child.type);
        
        if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
          meshCount++;
          meshes.push({
            name: child.name,
            type: child.type,
            geometry: child.geometry,
            material: child.material,
            visible: child.visible
          });
          
          // Ensure visibility and shadows
          child.visible = true;
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            materialCount++;
            materials.push(child.material);
          }
        }
      });
      
      // Get bounding box
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      const info = {
        meshCount,
        materialCount,
        animationCount: animations ? animations.length : 0,
        boundingBox: {
          size: { x: size.x, y: size.y, z: size.z },
          center: { x: center.x, y: center.y, z: center.z }
        },
        meshes,
        materials,
        animations: animations ? animations.map(anim => ({
          name: anim.name,
          duration: anim.duration,
          tracks: anim.tracks.length
        })) : []
      };
      
      setModelInfo(info);
      setLoadingStatus(`Loaded: ${meshCount} meshes, ${materialCount} materials, ${info.animationCount} animations`);
      
      console.log('Model info:', info);
      
      // Try to play first animation if available
      if (actions && Object.keys(actions).length > 0) {
        const firstAction = actions[Object.keys(actions)[0]];
        if (firstAction) {
          console.log('Playing first animation:', Object.keys(actions)[0]);
          firstAction.play();
        }
      }
      
    }, [scene, animations, actions]);
    
    useFrame((state, delta) => {
      if (mixer) {
        mixer.update(delta);
      }
    });
    
    return (
      <group ref={groupRef}>
        {scene && (
          <primitive object={scene} scale={[1, 1, 1]} position={[0, 0, 0]} />
        )}
      </group>
    );
    
  } catch (error) {
    console.error('Error loading model:', error);
    setLoadingStatus(`Error: ${error.message}`);
    
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    );
  }
}

// Model options
const modelOptions = [
  { path: '/models/player.glb', name: 'Player Model' },
  { path: '/models/character.glb', name: 'Character Model' },
  { path: '/models/Wizard_Frog_0617073353_texture.glb', name: 'Wizard Frog' },
  { path: '/wAddle.glb', name: 'wAddle (Default)' },
  { path: '/wAddleBABYBL.glb', name: 'wAddle Blue' }
];

// Main test component
export default function PlayerModelTest() {
  const [selectedModel, setSelectedModel] = useState('/models/player.glb');
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#f0f0f0' }}>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 1000,
        background: 'rgba(255,255,255,0.9)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <h3>Player Model Test</h3>
        <div>
          <label>Select Model: </label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {modelOptions.map(option => (
              <option key={option.path} value={option.path}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          Current: {selectedModel}
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          Check browser console for detailed logs
        </div>
      </div>
      
      <Canvas
        camera={{ position: [0, 2, 5], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
        
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshLambertMaterial color="#999999" />
        </mesh>
        
        {/* Model */}
        <PlayerModelTester key={selectedModel} modelPath={selectedModel} />
        
        <OrbitControls />
      </Canvas>
    </div>
  );
}

// Preload all models
modelOptions.forEach(option => {
  useGLTF.preload(option.path);
});