import * as THREE from 'three';

// Enhanced animation utility with proper hand grip poses and limb animations
export function applyHangerPose(
  memeHanger: any, // MemeHanger instance
  opts: { isHolding: boolean; fallStart?: number; now: number }
) {
  const t = opts.now * 0.001;

  if (opts.isHolding) {
    // HANGING ANIMATION - hands stay anchored to bridge
    
    // Remove vertical bobbing - keep hands locked to bridge
    // No characterGroup.position.y changes to prevent floating
    
    // Subtle body sway while hands stay anchored
    memeHanger.group.rotation.x = Math.sin(t * 2.2) * 0.04; // gentle front-back sway
    memeHanger.group.rotation.z = Math.cos(t * 1.8) * 0.05; // side-to-side sway
    memeHanger.group.rotation.y = 0; // no spinning while hanging
    
    // Arm grip adjustments - slight shoulder movement while hands stay on bridge
    if (memeHanger.leftArm && memeHanger.rightArm) {
      // Arms maintain grip but show strain with subtle adjustments
      memeHanger.leftArm.rotation.y = Math.sin(t * 1.6) * 0.08;
      memeHanger.rightArm.rotation.y = Math.sin(t * 1.9) * 0.08;
      memeHanger.leftArm.rotation.z = Math.PI/8 + Math.sin(t * 2.0) * 0.04;
      memeHanger.rightArm.rotation.z = -Math.PI/8 + Math.sin(t * 2.2) * 0.04;
    }
    
    // Leg dangling motion - natural swinging
    if (memeHanger.legs && memeHanger.legs.length >= 2) {
      memeHanger.legs[0].group.rotation.x = Math.PI/10 + Math.sin(t * 1.1) * 0.15;
      memeHanger.legs[1].group.rotation.x = Math.PI/10 + Math.sin(t * 1.3) * 0.15;
      memeHanger.legs[0].group.rotation.z = Math.sin(t * 0.8) * 0.12;
      memeHanger.legs[1].group.rotation.z = Math.sin(t * 1.0) * 0.12;
    }
    
  } else {
    // FALLING ANIMATION - scripted tumbling sequence
    const fallT = (opts.now - (opts.fallStart ?? opts.now)) * 0.001;
    
    // Immediate grip release pose (first few moments)
    if (fallT < 0.3) {
      // Quick transition from hanging to falling pose
      const releaseProgress = fallT / 0.3;
      
      // Arms rotate down from overhead position
      if (memeHanger.leftArm && memeHanger.rightArm) {
        memeHanger.leftArm.rotation.z = THREE.MathUtils.lerp(Math.PI/8, -Math.PI/4, releaseProgress);
        memeHanger.rightArm.rotation.z = THREE.MathUtils.lerp(-Math.PI/8, Math.PI/4, releaseProgress);
      }
    }
    
    // Tumbling motion - forward flips and spins
    const easeOutQuad = (t: number) => t * (2 - t);
    memeHanger.group.rotation.x = Math.PI * 2 * easeOutQuad(Math.min(fallT / 2, 1)); // 360° flip in 2 seconds
    memeHanger.group.rotation.z = Math.sin(fallT * 4) * 0.6; // wobble
    memeHanger.group.rotation.y = fallT * 3; // continuous spin
    
    // Flailing limbs during fall
    if (memeHanger.leftArm && memeHanger.rightArm) {
      memeHanger.leftArm.rotation.x = Math.sin(fallT * 12) * 1.2; // rapid arm flailing
      memeHanger.rightArm.rotation.x = Math.cos(fallT * 12) * 1.2;
      memeHanger.leftArm.rotation.y = Math.sin(fallT * 8) * 0.8;
      memeHanger.rightArm.rotation.y = Math.cos(fallT * 8) * 0.8;
    }
    
    // Leg bicycling motion
    if (memeHanger.legs && memeHanger.legs.length >= 2) {
      memeHanger.legs[0].group.rotation.x = Math.sin(fallT * 10) * 0.8;
      memeHanger.legs[1].group.rotation.x = Math.cos(fallT * 10) * 0.8;
      memeHanger.legs[0].group.rotation.z = Math.sin(fallT * 6) * 0.4;
      memeHanger.legs[1].group.rotation.z = Math.cos(fallT * 6) * 0.4;
    }
  }
}