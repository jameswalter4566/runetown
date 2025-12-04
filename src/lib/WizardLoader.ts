import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export async function loadWizard(scene: THREE.Scene) {
  const loader = new GLTFLoader();
  
  try {
    const gltf = await loader.loadAsync('/models/Wizard_Frog_0617073353_texture.glb');
    const model = gltf.scene;
    
    // Scale the model to match other characters
    model.scale.setScalar(0.025);
    model.position.set(0, 0, 0);
    
    // Enable shadows for all meshes
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Add to scene
    scene.add(model);
    
    // Set up animations
    const mixer = new THREE.AnimationMixer(model);
    const actions = new Map<string, THREE.AnimationAction>();
    
    if (gltf.animations.length > 0) {
      gltf.animations.forEach((clip) => {
        // Create standardized animation names
        const name = clip.name.toLowerCase();
        let key = name;
        
        // Map common animation names
        if (name.includes('idle')) key = 'idle';
        else if (name.includes('walk') || name.includes('run')) key = 'walk';
        else if (name.includes('attack') || name.includes('cast') || name.includes('spell')) key = 'attack';
        else if (name.includes('death') || name.includes('die')) key = 'death';
        
        // Set up the animation action
        const action = mixer.clipAction(clip);
        action.loop = THREE.LoopRepeat;
        actions.set(key, action);
        
        // Log available animations for debugging
        console.log(`Loaded animation: ${clip.name} → ${key}`);
      });

      // Function to play a specific animation
      const playAnimation = (name: string): boolean => {
        const action = actions.get(name);
        if (!action) return false;
        
        // Stop all currently playing animations
        actions.forEach((a) => a.stop());
        
        // Play the requested animation
        action.reset().play();
        return true;
      };
      
      // Start with idle animation if available
      if (actions.has('idle')) {
        playAnimation('idle');
      } else if (actions.size > 0) {
        // Play first available animation
        const firstKey = Array.from(actions.keys())[0];
        playAnimation(firstKey);
      }
      
      return {
        model,
        mixer,
        actions,
        playAnimation
      };
    }
    
    // Return without animations if none found
    return {
      model,
      mixer,
      actions,
      playAnimation: () => false
    };
    
  } catch (error) {
    console.error('Failed to load wizard model:', error);
    throw error;
  }
}