/* Wizard.ts - Loads and animates the Wizard Frog GLB model
   This class loads the external GLB model similar to SkeletonArcher
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Wizard {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  staff: THREE.Group;
  legs: Array<{ group: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh }>;
  clock: THREE.Clock;
  speed: number;
  stepAngle: number;
  isPlaying: boolean = false;
  
  // Animation properties
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private useGLBAnimations: boolean = false; // Flag to toggle between GLB and programmatic animations

  constructor() {
    console.log("Creating Wizard character");
    
    // Initialize the group container
    this.group = new THREE.Group();
    
    // Initialize empty parts that will be referenced
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.staff = new THREE.Group();
    this.legs = [];
    
    // Initialize animation properties
    this.clock = new THREE.Clock();
    this.speed = 2.0;               // steps per second (same as Knight)
    this.stepAngle = Math.PI / 5;   // how far limbs swing (same as Knight);
    
    // Load the GLB model immediately
    this.loadModel();
  }
  
  /**
   * Load the Wizard_Frog_0617073353_texture.glb model
   */
  private loadModel() {
    console.log("Loading Wizard_Frog_0617073353_texture.glb model");
    
    // Create a loader
    const loader = new GLTFLoader();
    
    // Use the absolute path to ensure it works in all environments
    const modelPath = window.location.origin + '/models/Wizard_Frog_0617073353_texture.glb';
    console.log("Loading from path:", modelPath);
    
    // Load the model
    loader.load(
      modelPath,
      (gltf) => {
        console.log("Wizard model loaded successfully", gltf);
        console.log('Number of children in scene:', gltf.scene.children.length);
        console.log('Scene traverse - all objects:');
        gltf.scene.traverse((child) => {
          if (child.type) {
            console.log(`- ${child.name || 'unnamed'} (${child.type})`);
          }
        });
        
        // Add the model to our group
        this.group.add(gltf.scene);
        
        // Apply uniform scale to match other character models
        // Try a much larger scale first to see the model
        gltf.scene.scale.setScalar(1.0);
        
        // Position the model
        gltf.scene.position.set(0, 0, 0);
        
        // Add debugging info
        console.log('Wizard model bounding box:', gltf.scene);
        console.log('Wizard model scale:', gltf.scene.scale);
        console.log('Wizard model position:', gltf.scene.position);
        
        // Log the model's bounding box for debugging
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        console.log('Wizard model size:', size);
        console.log('Wizard model center:', center);
        
        // Try to center the model if needed
        if (Math.abs(center.y) > 0.1) {
          gltf.scene.position.y = -center.y;
          console.log('Adjusted wizard position to center:', gltf.scene.position);
        }
        
        // If the model is huge, scale it down
        if (size.y > 10) {
          const newScale = 2.0 / size.y; // Target height of 2 units
          gltf.scene.scale.setScalar(newScale);
          console.log('Auto-scaled wizard to:', newScale);
        } else if (size.y < 0.1) {
          // If model is tiny, scale it up
          const newScale = 2.0 / size.y;
          gltf.scene.scale.setScalar(newScale);
          console.log('Auto-scaled tiny wizard to:', newScale);
        }
        
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
        const foundParts: string[] = [];
        gltf.scene.traverse((object) => {
          // Log all object names to help with debugging
          if (object.name) {
            console.log("Found object:", object.name);
          }
          
          const nameLower = object.name.toLowerCase();
          
          // Find arms - look for various naming conventions
          if ((nameLower.includes('arm') && nameLower.includes('left')) || 
              nameLower.includes('leftarm') || 
              nameLower.includes('left_arm') ||
              nameLower.includes('l_arm') ||
              nameLower.includes('arm_l')) {
            this.leftArm = object as THREE.Group;
            foundParts.push('leftArm');
          } else if ((nameLower.includes('arm') && nameLower.includes('right')) || 
                     nameLower.includes('rightarm') || 
                     nameLower.includes('right_arm') ||
                     nameLower.includes('r_arm') ||
                     nameLower.includes('arm_r')) {
            this.rightArm = object as THREE.Group;
            foundParts.push('rightArm');
          }
          
          // Find legs - look for various naming conventions
          if ((nameLower.includes('leg') && nameLower.includes('left')) || 
              nameLower.includes('leftleg') || 
              nameLower.includes('left_leg') ||
              nameLower.includes('l_leg') ||
              nameLower.includes('leg_l')) {
            const leg = { group: object as THREE.Group, upper: object as THREE.Mesh, lower: object as THREE.Mesh };
            if (this.legs.length === 0) this.legs.push(leg);
            foundParts.push('leftLeg');
          } else if ((nameLower.includes('leg') && nameLower.includes('right')) || 
                     nameLower.includes('rightleg') || 
                     nameLower.includes('right_leg') ||
                     nameLower.includes('r_leg') ||
                     nameLower.includes('leg_r')) {
            const leg = { group: object as THREE.Group, upper: object as THREE.Mesh, lower: object as THREE.Mesh };
            if (this.legs.length === 1) this.legs.push(leg);
            else if (this.legs.length === 0) { this.legs.push({ group: new THREE.Group(), upper: new THREE.Mesh(), lower: new THREE.Mesh() }); this.legs.push(leg); }
            foundParts.push('rightLeg');
          }
          
          // Find staff/wand
          if (nameLower.includes('staff') || nameLower.includes('wand')) {
            this.staff = object as THREE.Group;
            foundParts.push('staff');
          }
          
          // Add shadow casting for all meshes
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        
        console.log('Found wizard parts:', foundParts);
        
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
        console.log(`Loading Wizard_Frog_0617073353_texture.glb: ${percent}%`);
      },
      (error) => {
        console.error("Error loading Wizard_Frog_0617073353_texture.glb:", error);
        // Fallback to the original THREE.js wizard if GLB fails
        console.log("Falling back to THREE.js wizard model");
        this.createFallbackWizard();
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
      console.warn(`Wizard: Animation "${name}" not found.`);
    }
  }

  /* call each frame – returns false if not yet started */
  update(): boolean {
    if (!this.isPlaying) return false;

    // If using GLB animations and mixer exists, update it
    if (this.useGLBAnimations && this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
      return true;
    }
    
    // Otherwise use programmatic animations like other THREE.js models
    const t = this.clock.getElapsedTime() * this.speed * Math.PI;
    
    // Helper function to swing limbs
    const swing = (limb: THREE.Group | THREE.Object3D, phase: number) => {
      if (limb) {
        limb.rotation.x = Math.sin(t + phase) * this.stepAngle;
      }
    };

    // Animate arms with opposite phase (like Knight)
    swing(this.leftArm, 0);
    swing(this.rightArm, Math.PI);
    
    // Animate legs with opposite phase
    if (this.legs && this.legs.length >= 2) {
      swing(this.legs[0].group, Math.PI);
      swing(this.legs[1].group, 0);
    }
    
    // Gentle staff movement if it exists
    if (this.staff) {
      this.staff.rotation.z = Math.sin(t * 0.5) * 0.1;
    }
    
    return true;
  }

  play() { 
    console.log("Wizard: Starting animation");
    this.isPlaying = true;  
    this.clock.start(); 
    
    // Play animations if mixer and animations exist
    if (this.mixer && this.animations.size > 0) {
      console.log("Playing animations for wizard model");
      
      // Only use GLB animations if we want to (disabled by default for consistency)
      if (this.useGLBAnimations) {
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
  }
  
  pause() { 
    console.log("Wizard: Pausing animation");
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
  
  // Fallback method to create original THREE.js wizard if GLB fails
  private createFallbackWizard() {
    // Materials
    const robeMat = new THREE.MeshToonMaterial({ color: 0x4B0082 });
    const skinMat = new THREE.MeshToonMaterial({ color: 0xFFDBB4 });
    const hatMat = new THREE.MeshToonMaterial({ color: 0x4B0082 });
    const beardMat = new THREE.MeshToonMaterial({ color: 0xE0E0E0 });
    const staffMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
    const orbMat = new THREE.MeshToonMaterial({ 
      color: 0x00FFFF, 
      emissive: 0x00FFFF, 
      emissiveIntensity: 0.5 
    });
    
    // Simple wizard body
    const bodyGeo = new THREE.ConeGeometry(0.8, 2, 8);
    const body = new THREE.Mesh(bodyGeo, robeMat);
    body.position.y = 1;
    this.group.add(body);
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.3;
    this.group.add(head);
    
    // Hat
    const hatGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 2.8;
    this.group.add(hat);
    
    // Staff
    const staffGeo = new THREE.CylinderGeometry(0.05, 0.05, 2);
    const staff = new THREE.Mesh(staffGeo, staffMat);
    staff.position.set(0.8, 1, 0);
    staff.rotation.z = -0.2;
    this.group.add(staff);
    
    // Orb on staff
    const orbGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0.8, 2, 0);
    this.group.add(orb);
  }
}