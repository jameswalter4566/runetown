import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Load the skeleton-archer GLB, add it to the scene, and wire up its animations.
 * @param {THREE.Scene} scene
 * @returns {Promise<{model:THREE.Object3D,
 *                    mixer:THREE.AnimationMixer,
 *                    actions:Map<string,THREE.AnimationAction>,
 *                    playAnimation:(name:string)=>boolean}>}
 */
export async function loadSkeletonArcher(scene) {
  const loader = new GLTFLoader();
  const url = '/models/skeleton_archer.glb'; // served from public/
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, -8, 26);
        model.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        const actions = new Map();

        // Normalise clip names to generic keys
        gltf.animations.forEach((clip) => {
          const n = clip.name.toLowerCase();
          let key = n
            .replace(/\\s+/g, '_')
            .replace(/mixamo/gi, '')
            .replace(/_/g, '');
          if (n.includes('idle')) key = 'idle';
          else if (n.includes('walk') || n.includes('run')) key = 'walk';
          else if (n.includes('strafe') && n.includes('left')) key = 'strafe_left';
          else if (n.includes('strafe') && n.includes('right')) key = 'strafe_right';
          const action = mixer.clipAction(clip);
          action.loop = THREE.LoopRepeat;
          actions.set(key, action);
        });

        const playAnimation = (name) => {
          const action = actions.get(name);
          if (!action) return false;
          actions.forEach((a) => a.stop());
          action.reset().play();
          return true;
        };

        resolve({ model, mixer, actions, playAnimation });
      },
      undefined,
      (err) => reject(err)
    );
  });
}