/* Dragon.ts - 3D dragon lord character model
   Humanoid dragon warrior with wings and scales
*/

import * as THREE from 'three';

export class Dragon {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  legs: Array<{ group: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh }>;
  tail: THREE.Group;
  clock: THREE.Clock;
  speed: number;
  stepAngle: number;
  isPlaying: boolean = false;

  constructor() {
    this.group = new THREE.Group();

    /* ---------- MATERIALS ---------- */
    const scaleMat = new THREE.MeshToonMaterial({ color: 0xFF4500 }); // Orange-red scales
    const bellyMat = new THREE.MeshToonMaterial({ color: 0xFFD700 }); // Golden belly
    const hornMat = new THREE.MeshToonMaterial({ color: 0x8B0000 }); // Dark red horns
    const wingMat = new THREE.MeshToonMaterial({ color: 0xCC3300, opacity: 0.9, transparent: true });
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
      // Dragon snout shape
      const headGeo = new THREE.BoxGeometry(1.0, 1.2, 1.4).toNonIndexed();
      const head = new THREE.Mesh(headGeo, scaleMat);
      makeStroke(head);
      headGroup.add(head);

      // Snout extension
      const snoutGeo = new THREE.BoxGeometry(0.6, 0.5, 0.8);
      const snout = new THREE.Mesh(snoutGeo, scaleMat);
      snout.position.set(0, -0.2, 0.7);
      makeStroke(snout);
      headGroup.add(snout);

      // Horns
      const hornGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
      const leftHorn = new THREE.Mesh(hornGeo, hornMat);
      leftHorn.rotation.z = -Math.PI / 6;
      leftHorn.position.set(-0.35, 0.7, -0.2);
      makeStroke(leftHorn);
      headGroup.add(leftHorn);

      const rightHorn = new THREE.Mesh(hornGeo, hornMat);
      rightHorn.rotation.z = Math.PI / 6;
      rightHorn.position.set(0.35, 0.7, -0.2);
      makeStroke(rightHorn);
      headGroup.add(rightHorn);

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const eyeMat = new THREE.MeshToonMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 0.3 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.25, 0.2, 0.6);
      headGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.25, 0.2, 0.6);
      headGroup.add(rightEye);

      // Nostrils
      const nostrilGeo = new THREE.SphereGeometry(0.05, 4, 4);
      const leftNostril = new THREE.Mesh(nostrilGeo, outlineMat);
      leftNostril.position.set(-0.1, -0.2, 1.0);
      headGroup.add(leftNostril);

      const rightNostril = new THREE.Mesh(nostrilGeo, outlineMat);
      rightNostril.position.set(0.1, -0.2, 1.0);
      headGroup.add(rightNostril);
    }
    headGroup.position.y = 1.6;
    this.group.add(headGroup);

    /* ---------- TORSO ---------- */
    const torsoGeo = new THREE.BoxGeometry(1.1, 1.3, 0.7);
    const torso = new THREE.Mesh(torsoGeo, scaleMat);
    makeStroke(torso);
    torso.position.y = 0.7;
    this.group.add(torso);

    // Belly scales
    const bellyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.2);
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, 0.7, 0.35);
    torso.add(belly);

    /* ---------- WINGS ---------- */
    const buildWing = (side: number) => {
      const wing = new THREE.Group();
      
      // Wing membrane
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(1.5, -0.5);
      wingShape.lineTo(1.8, -1.2);
      wingShape.lineTo(1.2, -1.5);
      wingShape.lineTo(0.3, -1.2);
      wingShape.lineTo(0, -0.5);
      
      const wingGeo = new THREE.ShapeGeometry(wingShape);
      const wingMesh = new THREE.Mesh(wingGeo, wingMat);
      wingMesh.rotation.y = side * Math.PI / 6;
      makeStroke(wingMesh);
      
      wing.add(wingMesh);
      wing.position.set(side * 0.6, 1.2, -0.3);
      return wing;
    };

    this.leftWing = buildWing(1);
    this.rightWing = buildWing(-1);
    this.group.add(this.leftWing, this.rightWing);

    /* ---------- ARMS ---------- */
    const armGeo = new THREE.CapsuleGeometry(0.25, 0.5, 4, 8);
    const clawGeo = new THREE.SphereGeometry(0.25, 8, 6);

    const buildArm = (side: number) => {
      const arm = new THREE.Group();
      const upper = new THREE.Mesh(armGeo, scaleMat);
      makeStroke(upper);
      const claw = new THREE.Mesh(clawGeo, scaleMat);
      makeStroke(claw);

      upper.rotation.z = side * Math.PI / 4;
      upper.position.set(side * 0.9, 0.6, 0);
      claw.position.set(side * 1.1, 0.1, 0);

      // Add claws
      const clawTipGeo = new THREE.ConeGeometry(0.08, 0.3, 4);
      for (let i = 0; i < 3; i++) {
        const clawTip = new THREE.Mesh(clawTipGeo, hornMat);
        clawTip.rotation.x = Math.PI;
        clawTip.position.set(side * 1.1 + (i - 1) * 0.1, -0.15, 0.1);
        arm.add(clawTip);
      }

      arm.add(upper, claw);
      return arm;
    };

    this.leftArm = buildArm(1);
    this.rightArm = buildArm(-1);
    this.group.add(this.leftArm, this.rightArm);

    /* ---------- LEGS ---------- */
    const legGeo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
    const footGeo = new THREE.BoxGeometry(0.6, 0.25, 0.5);

    const buildLeg = (side: number) => {
      const leg = new THREE.Group();
      const thigh = new THREE.Mesh(legGeo, scaleMat);
      makeStroke(thigh);
      const foot = new THREE.Mesh(footGeo, scaleMat);
      makeStroke(foot);

      thigh.position.set(side * 0.4, -0.6, 0);
      foot.position.set(side * 0.4, -1.3, 0.15);

      // Toe claws
      const toeGeo = new THREE.ConeGeometry(0.06, 0.2, 4);
      for (let i = 0; i < 3; i++) {
        const toe = new THREE.Mesh(toeGeo, hornMat);
        toe.rotation.x = Math.PI / 4;
        toe.position.set(side * 0.4 + (i - 1) * 0.15, -1.3, 0.35);
        leg.add(toe);
      }

      leg.add(thigh, foot);
      return { group: leg, upper: thigh, lower: foot };
    };

    const L = buildLeg(1);
    const R = buildLeg(-1);
    this.group.add(L.group, R.group);
    this.legs = [L, R];

    /* ---------- TAIL ---------- */
    this.tail = new THREE.Group();
    const tailSegments = 4;
    const prevSegment = torso;
    
    for (let i = 0; i < tailSegments; i++) {
      const size = 0.3 - i * 0.05;
      const tailGeo = new THREE.SphereGeometry(size, 8, 6);
      const tailSegment = new THREE.Mesh(tailGeo, scaleMat);
      makeStroke(tailSegment);
      tailSegment.position.set(0, -0.3 - i * 0.3, -0.3 - i * 0.2);
      this.tail.add(tailSegment);
    }
    
    this.group.add(this.tail);

    /* ---------- ANIMATION DATA ---------- */
    this.clock = new THREE.Clock();
    this.speed = 1.8;
    this.stepAngle = Math.PI / 6;
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

    // Wing flap
    this.leftWing.rotation.z = Math.sin(t * 0.5) * 0.2 + 0.2;
    this.rightWing.rotation.z = -Math.sin(t * 0.5) * 0.2 - 0.2;

    // Tail sway
    this.tail.rotation.x = Math.sin(t * 0.7) * 0.1;
    this.tail.rotation.y = Math.sin(t * 0.5) * 0.2;

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