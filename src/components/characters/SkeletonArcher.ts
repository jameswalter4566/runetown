/* SkeletonArcher.ts - Loads and animates the skeleton archer GLB model
   This class only loads the external GLB model with no fallback
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SkeletonArcher {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  legs: Array<{ group: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh }>;
  clock: THREE.Clock;
  isPlaying: boolean = false;
  bow: THREE.Group;
  hipAnchor: THREE.Group; // Added for bow stowing
  
  // Animation properties
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();

  constructor() {
    console.log("Creating SkeletonArcher character");
    
    // Initialize the group container
    this.group = new THREE.Group();
    
    // Initialize empty parts that will be referenced
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.legs = [];
    this.bow = new THREE.Group();
    this.hipAnchor = new THREE.Group();
    
    // Initialize animation clock
    this.clock = new THREE.Clock();
    
    // Load the GLB model immediately
    this.loadModel();
  }
  
  /**
   * Load the skeleton_archer.glb model
   */
  private loadModel() {
    console.log("Loading skeleton_archer.glb model");
    
    // Create a loader
    const loader = new GLTFLoader();
    
    // Use the absolute path to ensure it works in all environments
    const modelPath = window.location.origin + '/models/skeleton_archer.glb';
    console.log("Loading from path:", modelPath);
    
    // Load the model
    loader.load(
      modelPath,
      (gltf) => {
        console.log("Skeleton archer model loaded successfully", gltf);
        
        // Add the model to our group
        this.group.add(gltf.scene);
        
        // Apply uniform scale to match other character models
        // Set to 0.025 to properly match other characters
        gltf.scene.scale.setScalar(0.025);
        
        // Ensure feet touch the ground
        gltf.scene.position.y = 0;
        
        // Create animation mixer
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(gltf.scene);
          
          // Create actions for all animations
          gltf.animations.forEach((clip) => {
            const action = this.mixer.clipAction(clip);
            this.animations.set(clip.name.toLowerCase(), action);
            console.log(`Loaded animation: ${clip.name}`);
          });
          
          // If we're already playing, start animations
          if (this.isPlaying && this.animations.size > 0) {
            this.play();
          }
        }
        
        // Try to find parts we need references to
        gltf.scene.traverse((object) => {
          // Log all object names to help with debugging
          if (object.name) {
            console.log("Found object:", object.name);
          }
          
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
        
        // Create default legs array if none found
        if (this.legs.length === 0) {
          const dummyLeg = { 
            group: new THREE.Group(), 
            upper: new THREE.Mesh(), 
            lower: new THREE.Mesh() 
          };
          this.legs = [dummyLeg, dummyLeg];
        }
      },
      (xhr) => {
        // Progress callback
        const percent = Math.round(xhr.loaded / xhr.total * 100);
        console.log(`Loading skeleton_archer.glb: ${percent}%`);
      },
      (error) => {
        console.error("Error loading skeleton_archer.glb:", error);
        // No fallback - just leave an error message
        const errorText = document.createElement('div');
        errorText.style.color = 'red';
        errorText.textContent = 'Error loading skeleton_archer.glb';
        document.body.appendChild(errorText);
      }
    );
  }

  // Play a specific animation by name
  playAnimation(name: string) {
    if (!this.mixer) return;
    
    // Stop all current animations
    this.animations.forEach(action => action.stop());
    
    // Find and play the requested animation
    const action = this.animations.get(name.toLowerCase());
    if (action) {
      action.reset();
      action.play();
    } else {
      console.warn(`SkeletonArcher: Animation "${name}" not found.`);
    }
  }


  /* call each frame – returns false if not yet started */
  update(): boolean {
    if (!this.isPlaying) return false;

    // Update animation mixer if it exists
    if (this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
      return true;
    }
    
    return false;
  }

  play() { 
    console.log("SkeletonArcher: Starting animation");
    this.isPlaying = true;  
    this.clock.start(); 
    
    // Play animations if mixer and animations exist
    if (this.mixer && this.animations.size > 0) {
      console.log("Playing animations for skeleton archer model");
      
      // Try to find and play idle animation
      if (this.animations.has('idle')) {
        this.playAnimation('idle');
      } else if (this.animations.has('animation_0')) {
        this.playAnimation('animation_0');
      } else {
        // Otherwise use first available animation
        const firstAnim = Array.from(this.animations.keys())[0];
        if (firstAnim) {
          console.log(`Playing first available animation: ${firstAnim}`);
          this.playAnimation(firstAnim);
        }
      }
    }
  }
  
  pause() { 
    console.log("SkeletonArcher: Pausing animation");
    this.isPlaying = false; 
    this.clock.stop();
    
    // Stop all animations
    if (this.mixer) {
      this.animations.forEach(action => {
        if (action.isRunning()) {
          action.stop();
        }
      });
    }
  }
  
  // Method to aim the bow - can be called externally
  aimBow(direction: number) {
    if (this.bow) {
      // Adjust bow to aim in the specified direction
      this.bow.rotation.y = direction * 0.5;
    }
  }
  
  // Method to equip bow to hand
  equipBow = () => {
    // Try to play animation if it exists
    if (this.animations.has('equip')) {
      this.playAnimation('equip');
      return;
    }
    
    // Otherwise manually move the bow
    if (this.bow && this.leftArm) {
      console.log("Equipping bow");
      
      // Detach from hip or wherever it currently is
      this.group.attach(this.bow);
      
      // Attach to left hand/arm
      this.leftArm.add(this.bow);
      
      // Position in hand
      this.bow.position.set(0.3, 0, 0);
      this.bow.rotation.set(0, 0, 0);
    }
  };
  
  // Method to stow bow on hip/back
  stowBow = () => {
    // Try to play animation if it exists
    if (this.animations.has('stow')) {
      this.playAnimation('stow');
      return;
    }
    
    // Otherwise manually move the bow
    if (this.bow && this.hipAnchor) {
      console.log("Stowing bow");
      
      // Detach from current parent (arm/hand)
      this.group.attach(this.bow);
      
      // Attach to hip/back
      this.hipAnchor.add(this.bow);
      
      // Position on hip/back
      this.bow.position.set(0, -0.5, 0);
      this.bow.rotation.set(Math.PI / 2, 0, 0);
    }
  };
}