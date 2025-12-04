/* ModelLoader.ts - Efficient loading and caching of 3D models
   Singleton pattern to prevent duplicate loading of the same models
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Result interface for loaded models including scene and animations
export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  skeleton?: THREE.SkeletonHelper;
}

export class ModelLoader {
  private static instance: ModelLoader;
  private loader: GLTFLoader;
  private loadingManager: THREE.LoadingManager;
  private modelCache: Map<string, LoadedModel> = new Map();
  
  // Private constructor for singleton pattern
  private constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onProgress = (url, loaded, total) => {
      // Could emit an event or update a loading screen
      console.log(`Loading: ${Math.round((loaded / total) * 100)}%`);
    };
    
    this.loader = new GLTFLoader(this.loadingManager);
  }
  
  // Get the singleton instance
  public static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }
  
  // Load a model asynchronously (returns Promise)
  public async loadModel(path: string): Promise<LoadedModel> {
    // Check if model is already cached
    if (this.modelCache.has(path)) {
      // Create a deep clone of the cached model to avoid conflicts
      const cached = this.modelCache.get(path)!;
      
      return {
        scene: this.cloneGltfScene(cached.scene),
        animations: cached.animations.map(a => a.clone()),
        skeleton: cached.skeleton ? cached.skeleton.clone() : undefined
      };
    }
    
    // Not cached, load the model
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          // Create the result object
          const result: LoadedModel = {
            scene: gltf.scene,
            animations: gltf.animations,
          };
          
          // Setup skeleton helper if there's a skeleton
          if (gltf.scene.children.some(child => child.type === 'SkinnedMesh')) {
            // Create skeleton helper for debugging if needed
            let skeletonHelper: THREE.SkeletonHelper | undefined;
            gltf.scene.traverse((object) => {
              if (object instanceof THREE.SkinnedMesh) {
                skeletonHelper = new THREE.SkeletonHelper(object.skeleton.bones[0].parent!);
                // Make skeleton helper invisible by default
                if (skeletonHelper) skeletonHelper.visible = false;
              }
            });
            result.skeleton = skeletonHelper;
          }
          
          // Cache the result for future use
          this.modelCache.set(path, result);
          
          // Return the model
          resolve(result);
        },
        // Progress callback - nothing needed here as the manager handles it
        undefined,
        // Error callback
        (error) => {
          console.error(`Error loading model from ${path}:`, error);
          reject(error);
        }
      );
    });
  }
  
  // Helper method to clone a GLTF scene properly (including SkinnedMesh)
  private cloneGltfScene(scene: THREE.Group): THREE.Group {
    const clone = new THREE.Group();
    
    // Clone non-skeletal meshes normally
    scene.traverse((object) => {
      // Skip SkinnedMesh here - we'll handle them separately
      if (!(object instanceof THREE.SkinnedMesh) && object instanceof THREE.Mesh) {
        const clonedMesh = object.clone();
        clonedMesh.position.copy(object.position);
        clonedMesh.quaternion.copy(object.quaternion);
        clonedMesh.scale.copy(object.scale);
        clone.add(clonedMesh);
      }
    });
    
    // Handle SkinnedMesh with care (need to recreate bones)
    scene.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh) {
        const skinnedMesh = object;
        const geometry = skinnedMesh.geometry.clone();
        const material = skinnedMesh.material.clone();
        const clonedMesh = new THREE.SkinnedMesh(geometry, material);
        
        // Copy transformations
        clonedMesh.position.copy(skinnedMesh.position);
        clonedMesh.quaternion.copy(skinnedMesh.quaternion);
        clonedMesh.scale.copy(skinnedMesh.scale);
        
        // Copy skinning
        clonedMesh.bindMatrix.copy(skinnedMesh.bindMatrix);
        clonedMesh.bindMode = skinnedMesh.bindMode;
        
        // Recreate the skeleton and bones
        const skeleton = skinnedMesh.skeleton.clone();
        clonedMesh.skeleton = skeleton;
        
        clone.add(clonedMesh);
      }
    });
    
    return clone;
  }
  
  // Preload multiple models at once
  public async preloadModels(paths: string[]): Promise<void> {
    const promises = paths.map(path => this.loadModel(path));
    await Promise.all(promises);
  }
  
  // Clear specific models from cache
  public clearFromCache(path: string): void {
    this.modelCache.delete(path);
  }
  
  // Clear all models from cache
  public clearCache(): void {
    this.modelCache.clear();
  }
}