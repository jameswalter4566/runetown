# 3D Character Models

This directory contains 3D character models used in the game. The models are in GLB format, which includes mesh geometry, textures, materials, and animations.

## Skeleton Archer Model

The `skeleton_archer.glb` model is a 3D character model for the Skeleton Archer faction. It includes:

- Fully rigged skeletal mesh
- Texture maps
- Multiple animations
- Bone structure for character animation

### Standard Animations

The model should include the following standard animations:

- `idle` - Default standing animation
- `walk` - Walking animation
- `attack` - Attack animation
- `equip` - Equipping bow animation
- `stow` - Stowing bow animation

## Testing the Model

You can test the model and its animations by opening `/model-test.html` in a web browser. This page provides a simple interface to:

1. View the model in 3D
2. Play different animations
3. Toggle skeleton visibility for debugging
4. Test bow equip/stow animations

## Model Requirements

When creating new character models, follow these guidelines:

1. Export as GLB format with embedded textures
2. Include standard animations named consistently
3. Use a T-pose as the default pose
4. Scale the model appropriately (use the model-test.html to verify)
5. Use proper bone naming conventions:
   - `leftArm` for the left arm bone
   - `rightArm` for the right arm bone
   - `bow` for any bow attachments
   - `hip` for the hip bone/attachment point

## Using Character Models in the Game

Character models are loaded using the `CharacterLoader.js` utility, which provides:

1. Standardized animation names
2. Animation mixing and crossfading
3. Skeleton visualization for debugging
4. Model loading with caching
5. Specialized loading for specific character types (like SkeletonArcher)

Example usage:

```typescript
import { loadSkeletonArcher } from '@/lib/CharacterLoader';

// In a component or scene setup:
const characterData = await loadSkeletonArcher(scene);
const { model, mixer, actions } = characterData;

// Play an animation
characterData.playAnimation('idle');

// Toggle skeleton visibility (for debugging)
characterData.toggleSkeleton();

// Update the animation in the render loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixer.update(delta);
  renderer.render(scene, camera);
}
```