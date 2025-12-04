/* BlenderCharacter.ts - Load and animate models exported from Blender
   This class loads a glTF/GLB 3D model and handles animations
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Animation states that can be played
export type AnimationState = 'idle' | 'walk' | 'run' | 'attack' | 'death';

export class BlenderCharacter {
  // Required public properties to match other character classes
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  bow: THREE.Group;
  hipAnchor: THREE.Group;
  legs: Array<{ group: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh }>;
  
  // Animation properties
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private clock: THREE.Clock;
  private currentAnimation: string | null = null;
  private isPlaying = false;
  private isLoaded = false;
  
  // Model path - change this to your model's path
  private modelPath: string;
  
  constructor(modelPath: string = '/models/character.glb') {
    // Initialize default properties
    this.group = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.bow = new THREE.Group();
    this.hipAnchor = new THREE.Group();
    this.legs = [];
    this.clock = new THREE.Clock();
    this.modelPath = modelPath;
    
    // Load the model immediately
    this.loadModel();
  }
  
  private loadModel() {
    const loader = new GLTFLoader();
    
    // Create a loading manager to track progress
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => {
      console.log(`Loading model: ${Math.round(loaded / total * 100)}%`);
    };
    
    // Load the model with the manager
    console.log(`Loading model from path: ${this.modelPath}`);
    loader.setPath('');
    loader.load(
      this.modelPath,
      (gltf) => {
        console.log('Model loaded successfully:', gltf);
        
        // Add the model to our group
        this.group.add(gltf.scene);
        
        // Scale adjustment for skeleton_archer model
        console.log('Applying scale to the model');
        gltf.scene.scale.set(0.02, 0.02, 0.02); // Much smaller scale for the skeleton_archer model
        
        // Setup the animation mixer if animations exist
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(gltf.scene);
          
          // Create actions for all animations
          gltf.animations.forEach((clip) => {
            const action = this.mixer.clipAction(clip);
            this.animations.set(clip.name.toLowerCase(), action);
            console.log(`Animation loaded: ${clip.name}`);
          });
          
          // Try to play an idle animation if it exists
          if (this.animations.has('idle')) {
            this.playAnimation('idle');
          } else if (gltf.animations.length > 0) {
            // Otherwise play the first animation
            this.playAnimation(gltf.animations[0].name.toLowerCase());
          }
        }
        
        // Find model parts by name to match our character interface
        gltf.scene.traverse((object) => {
          // Store references to important parts based on object names
          // These names should match what you used in Blender
          if (object.name.toLowerCase().includes('leftarm')) {
            this.leftArm = object as THREE.Group;
          } else if (object.name.toLowerCase().includes('rightarm')) {
            this.rightArm = object as THREE.Group;
          } else if (object.name.toLowerCase().includes('bow')) {
            this.bow = object as THREE.Group;
          } else if (object.name.toLowerCase().includes('hip')) {
            this.hipAnchor = object as THREE.Group;
          }
          
          // Add shadow casting for all meshes
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        
        this.isLoaded = true;
        
        // Start animation if play was called before model loaded
        if (this.isPlaying && this.currentAnimation) {
          this.playAnimation(this.currentAnimation);
        }
      },
      // Progress callback
      (xhr) => {
        // console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      // Error callback
      (error) => {
        console.error('Error loading model:', error);
        console.error('Failed path:', this.modelPath);
        
        // Create a simple placeholder to indicate error
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const errorMesh = new THREE.Mesh(geometry, material);
        this.group.add(errorMesh);
      }
    );
  }
  
  // Play a specific animation by name
  playAnimation(name: string) {
    this.currentAnimation = name.toLowerCase();
    
    if (!this.mixer || !this.isLoaded) return;
    
    // Stop all current animations
    this.animations.forEach(action => action.stop());
    
    // Find and play the requested animation
    const action = this.animations.get(this.currentAnimation);
    if (action) {
      action.reset();
      action.play();
      action.crossFadeFrom(action, 0.5, true);
    } else {
      console.warn(`Animation "${name}" not found.`);
    }
  }
  
  // Update method called on each frame
  update(): boolean {
    if (!this.isPlaying || !this.mixer) return false;
    
    // Update the animation mixer with clock delta
    const delta = this.clock.getDelta();
    this.mixer.update(delta);
    
    return true;
  }
  
  // Animation control methods to match other character classes
  play() {
    this.isPlaying = true;
    this.clock.start();
    
    if (this.isLoaded && this.currentAnimation && this.mixer) {
      const action = this.animations.get(this.currentAnimation);
      if (action) action.play();
    }
  }
  
  pause() {
    this.isPlaying = false;
    this.clock.stop();
    
    if (this.mixer && this.currentAnimation) {
      const action = this.animations.get(this.currentAnimation);
      if (action) action.stop();
    }
  }
  
  // Method to handle bow equipment (override with your model's specifics)
  equipBow = () => {
    if (!this.isLoaded) return;
    
    // If your model has a specific animation for equipping the bow, play it
    if (this.animations.has('equip_bow')) {
      const action = this.animations.get('equip_bow')!;
      action.reset().play();
      
      // Switch back to previous animation when done
      if (this.currentAnimation) {
        const prevAnim = this.currentAnimation;
        setTimeout(() => {
          this.playAnimation(prevAnim);
        }, action.getClip().duration * 1000);
      }
    }
    
    // If your model has separate bow object that needs to move
    if (this.bow && this.leftArm) {
      // Detach from hip, attach to hand
      this.group.attach(this.bow);
      this.leftArm.add(this.bow);
      // Position bow in hand - adjust values based on your model
      this.bow.position.set(0.2, 0, 0);
      this.bow.rotation.set(0, 0, 0);
    }
  };
  
  // Method to handle bow stowing
  stowBow = () => {
    if (!this.isLoaded) return;
    
    // If your model has a specific animation for stowing the bow, play it
    if (this.animations.has('stow_bow')) {
      const action = this.animations.get('stow_bow')!;
      action.reset().play();
      
      // Switch back to previous animation when done
      if (this.currentAnimation) {
        const prevAnim = this.currentAnimation;
        setTimeout(() => {
          this.playAnimation(prevAnim);
        }, action.getClip().duration * 1000);
      }
    }
    
    // If your model has separate bow object that needs to move
    if (this.bow && this.hipAnchor) {
      // Detach from hand, attach to hip
      this.group.attach(this.bow);
      this.hipAnchor.add(this.bow);
      // Position bow on hip - adjust values based on your model
      this.bow.position.set(0, 0, 0);
      this.bow.rotation.set(0, 0, 0);
    }
  };
}