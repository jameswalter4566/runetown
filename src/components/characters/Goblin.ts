/* Goblin.ts - 3D goblin character model
   Mischievous green creature with large ears and hunched posture
*/

import * as THREE from 'three';

export class Goblin {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  legs: Array<{ group: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh }>;
  clock: THREE.Clock;
  speed: number;
  stepAngle: number;
  isPlaying: boolean = false;

  constructor() {
    this.group = new THREE.Group();

    /* ---------- MATERIALS ---------- */
    const skinMat = new THREE.MeshToonMaterial({ color: 0x4A7C3C }); // Green skin
    const clothMat = new THREE.MeshToonMaterial({ color: 0x8B4513 }); // Brown cloth
    const eyeMat = new THREE.MeshToonMaterial({ color: 0xFFFF00 }); // Yellow eyes
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    /* ---------- UTILITY: add black outline ---------- */
    const makeStroke = (mesh: THREE.Mesh) => {
      const stroke = mesh.clone();
      stroke.material = outlineMat.clone();
      (stroke.material as THREE.MeshBasicMaterial).side = THREE.BackSide;
      stroke.scale.multiplyScalar(1.06);
      mesh.add(stroke);
    };

    /* ---------- HEAD ---------- */
    const headGroup = new THREE.Group();
    {
      // Main head (wider than tall)
      const headGeo = new THREE.BoxGeometry(1.3, 1.0, 1.1).toNonIndexed();
      const head = new THREE.Mesh(headGeo, skinMat);
      makeStroke(head);
      headGroup.add(head);

      // Large pointed ears
      const earGeo = new THREE.ConeGeometry(0.3, 0.8, 4);
      const leftEar = new THREE.Mesh(earGeo, skinMat);
      leftEar.rotation.z = -Math.PI / 3;
      leftEar.position.set(-0.7, 0.3, 0);
      makeStroke(leftEar);
      headGroup.add(leftEar);

      const rightEar = new THREE.Mesh(earGeo, skinMat);
      rightEar.rotation.z = Math.PI / 3;
      rightEar.position.set(0.7, 0.3, 0);
      makeStroke(rightEar);
      headGroup.add(rightEar);

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.3, 0.1, 0.5);
      headGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.3, 0.1, 0.5);
      headGroup.add(rightEye);

      // Nose
      const noseGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
      const nose = new THREE.Mesh(noseGeo, skinMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, -0.1, 0.6);
      makeStroke(nose);
      headGroup.add(nose);

      // Teeth
      const toothGeo = new THREE.BoxGeometry(0.08, 0.15, 0.05);
      const toothMat = new THREE.MeshToonMaterial({ color: 0xFFFFF0 });
      for (let i = -2; i <= 2; i++) {
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        tooth.position.set(i * 0.12, -0.35, 0.5);
        tooth.rotation.z = Math.random() * 0.2 - 0.1;
        headGroup.add(tooth);
      }
    }
    headGroup.position.y = 1.3;
    this.group.add(headGroup);

    /* ---------- TORSO (hunched) ---------- */
    const torsoGeo = new THREE.BoxGeometry(0.9, 1.0, 0.6);
    const torso = new THREE.Mesh(torsoGeo, clothMat);
    torso.rotation.x = Math.PI / 8; // Hunched forward
    makeStroke(torso);
    torso.position.set(0, 0.6, -0.1);
    this.group.add(torso);

    /* ---------- ARMS (skinny and long) ---------- */
    const armGeo = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
    const handGeo = new THREE.SphereGeometry(0.2, 8, 6);

    const buildArm = (side: number) => {
      const arm = new THREE.Group();
      const upper = new THREE.Mesh(armGeo, skinMat);
      makeStroke(upper);
      const hand = new THREE.Mesh(handGeo, skinMat);
      makeStroke(hand);

      upper.rotation.z = side * Math.PI / 3;
      upper.position.set(side * 0.7, 0.5, 0);
      hand.position.set(side * 0.9, 0, 0);

      // Claws
      const clawGeo = new THREE.ConeGeometry(0.05, 0.2, 4);
      for (let i = 0; i < 3; i++) {
        const claw = new THREE.Mesh(clawGeo, outlineMat);
        claw.rotation.x = Math.PI;
        claw.position.set(side * 0.9 + (i - 1) * 0.08, -0.1, 0.1);
        arm.add(claw);
      }

      arm.add(upper, hand);
      return arm;
    };

    this.leftArm = buildArm(1);
    this.rightArm = buildArm(-1);
    this.group.add(this.leftArm, this.rightArm);

    /* ---------- LEGS (short and bowed) ---------- */
    const legGeo = new THREE.CapsuleGeometry(0.2, 0.4, 4, 8);
    const footGeo = new THREE.BoxGeometry(0.5, 0.2, 0.4);

    const buildLeg = (side: number) => {
      const leg = new THREE.Group();
      const thigh = new THREE.Mesh(legGeo, clothMat);
      makeStroke(thigh);
      const foot = new THREE.Mesh(footGeo, skinMat);
      makeStroke(foot);

      thigh.rotation.z = side * Math.PI / 12; // Bowed legs
      thigh.position.set(side * 0.35, -0.5, 0);
      foot.position.set(side * 0.4, -0.95, 0.1);

      leg.add(thigh, foot);
      return { group: leg, upper: thigh, lower: foot };
    };

    const L = buildLeg(1);
    const R = buildLeg(-1);
    this.group.add(L.group, R.group);
    this.legs = [L, R];

    /* ---------- WEAPON - Club ---------- */
    const clubGroup = new THREE.Group();
    const clubHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.8),
      new THREE.MeshToonMaterial({ color: 0x8B4513 })
    );
    const clubHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 6),
      new THREE.MeshToonMaterial({ color: 0x666666 })
    );
    clubHead.position.y = 0.5;
    clubGroup.add(clubHandle, clubHead);
    clubGroup.rotation.z = -Math.PI / 6;
    clubGroup.position.set(0.7, 0.3, 0);
    this.rightArm.add(clubGroup);

    /* ---------- ANIMATION DATA ---------- */
    this.clock = new THREE.Clock();
    this.speed = 2.5; // Faster, more erratic movement
    this.stepAngle = Math.PI / 4; // Larger swing for comedic effect
  }

  update(): boolean {
    if (!this.isPlaying) return false;

    const t = this.clock.getElapsedTime() * this.speed * Math.PI;
    
    const swing = (limb: THREE.Group, phase: number) => {
      limb.rotation.x = Math.sin(t + phase) * this.stepAngle;
    };

    swing(this.leftArm, 0);
    swing(this.rightArm, Math.PI);
    swing(this.legs[0].group, Math.PI);
    swing(this.legs[1].group, 0);

    // Slight body bounce
    this.group.position.y = Math.abs(Math.sin(t * 2)) * 0.05;

    return true;
  }

  play() { 
    this.isPlaying = true;  
    this.clock.start(); 
  }
  
  pause() { 
    this.isPlaying = false; 
    this.clock.stop();  
  }
}