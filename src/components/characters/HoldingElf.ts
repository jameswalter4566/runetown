/* HoldingElf.ts – Modified elf character in extended arms holding position */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export class HoldingElf {
  /* ---------------------------- public fields ---------------------------- */
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  legs: Array<{ group: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh }>;
  /* ----------------------- internal animation state ---------------------- */
  private clock: THREE.Clock;
  private isHolding: boolean = true;

  constructor() {
    /* ---------- MASTER GROUP ---------- */
    this.group = new THREE.Group();

    /* ---------- MATERIALS ---------- */
    const skinMat   = new THREE.MeshToonMaterial({ color: 0xffe4c4 }); // fair
    const tunicMat  = new THREE.MeshToonMaterial({ color: 0x228b22 }); // forest
    const bootMat   = new THREE.MeshToonMaterial({ color: 0x8b4513 }); // brown
    const hairMat   = new THREE.MeshToonMaterial({ color: 0xffd700 }); // gold
    const accentMat = new THREE.MeshToonMaterial({ color: 0x20b2aa }); // teal
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    /* ---------- UTILITY: outline helper ---------- */
    const makeStroke = (mesh: THREE.Mesh) => {
      const stroke = mesh.clone();
      stroke.material = outlineMat.clone();
      (stroke.material as THREE.MeshBasicMaterial).side = THREE.BackSide;
      stroke.scale.multiplyScalar(1.06);
      mesh.add(stroke);
    };

    /* =====================================================================
       HEAD  (rounded box + black eyes + bangs + worried expression)
    ===================================================================== */
    const headGroup = new THREE.Group();
    {
      /* main head */
      const headGeo = new RoundedBoxGeometry(1.0, 1.25, 1.0, 6, 0.15);
      const head = new THREE.Mesh(headGeo, skinMat);
      makeStroke(head);
      headGroup.add(head);

      /* ears */
      const earGeo = new THREE.ConeGeometry(0.15, 0.4, 4);
      const leftEar = new THREE.Mesh(earGeo, skinMat);
      leftEar.rotation.set(Math.PI / 6, 0, -Math.PI / 3);
      leftEar.position.set(-0.52, 0.25, 0);
      makeStroke(leftEar);
      headGroup.add(leftEar);

      const rightEar = leftEar.clone();
      rightEar.rotation.z = Math.PI / 3;
      rightEar.position.x *= -1;
      headGroup.add(rightEar);

      /* big black cylindrical eyes - wider for worried look */
      const eyeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16);
      const eyeMat = new THREE.MeshToonMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.rotation.x = Math.PI / 2;
      leftEye.position.set(-0.3, 0.1, 0.52);
      headGroup.add(leftEye);

      const rightEye = leftEye.clone();
      rightEye.position.x *= -1;
      headGroup.add(rightEye);

      /* worried eyebrows */
      const browGeo = new THREE.PlaneGeometry(0.3, 0.05);
      const browMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
      const leftBrow = new THREE.Mesh(browGeo, browMat);
      leftBrow.position.set(-0.25, 0.35, 0.51);
      leftBrow.rotation.z = 0.3;
      headGroup.add(leftBrow);

      const rightBrow = leftBrow.clone();
      rightBrow.position.x *= -1;
      rightBrow.rotation.z *= -1;
      headGroup.add(rightBrow);

      /* open mouth (worried expression) */
      const mouthGeo = new THREE.RingGeometry(0.06, 0.1, 8);
      const mouthMat = new THREE.MeshToonMaterial({ color: 0x000000 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0, 0, 0.51);
      mouth.rotation.x = Math.PI / 2;
      headGroup.add(mouth);

      /* bangs */
      const bangGeo = new THREE.PlaneGeometry(0.5, 0.6);
      for (let i = 0; i < 3; i++) {
        const bang = new THREE.Mesh(bangGeo, hairMat);
        bang.position.set((i - 1) * 0.25, 0.35, 0.51);
        bang.rotation.y = (i - 1) * 0.1;
        makeStroke(bang);
        headGroup.add(bang);
      }

      /* hair cap */
      const hairGeo = new THREE.SphereGeometry(0.55, 20, 16);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.scale.set(1.2, 1.1, 1.05);
      hair.position.y = 0.4;
      makeStroke(hair);
      headGroup.add(hair);
    }
    headGroup.position.y = 1.65;
    headGroup.scale.set(1.15, 1.15, 1.15); // chibi proportions
    this.group.add(headGroup);

    /* =====================================================================
       TORSO  (box + skirt + belt & buckle + leaf motif)
    ===================================================================== */
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
    const torso = new THREE.Mesh(torsoGeo, tunicMat);
    makeStroke(torso);
    torso.position.y = 0.7;
    this.group.add(torso);

    /* belt */
    const beltGeo = new THREE.BoxGeometry(0.9, 0.15, 0.55);
    const belt = new THREE.Mesh(beltGeo, bootMat);
    belt.position.y = 0.35;
    makeStroke(belt);
    torso.add(belt);

    /* big teal buckle */
    const buckleGeo = new THREE.OctahedronGeometry(0.12);
    const buckle = new THREE.Mesh(buckleGeo, accentMat);
    buckle.rotation.y = Math.PI / 4;
    buckle.position.set(0, 0.02, 0.29);
    belt.add(buckle);

    /* flared skirt */
    const skirtGeo = new THREE.ConeGeometry(0.9, 0.55, 8, 1, true);
    const skirt = new THREE.Mesh(skirtGeo, tunicMat);
    skirt.rotation.x = Math.PI;
    skirt.position.y = -0.35;
    makeStroke(skirt);
    torso.add(skirt);

    /* leaf pattern on chest */
    const leafGeo = new THREE.ConeGeometry(0.1, 0.2, 4);
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(leafGeo, accentMat);
      leaf.position.set((i - 1) * 0.22, 0.2, 0.28);
      leaf.rotation.z = Math.PI;
      torso.add(leaf);
    }

    /* =====================================================================
       ARMS  (raised overhead, gripping bridge above)
    ===================================================================== */
    const armGeo  = new THREE.CapsuleGeometry(0.18, 0.7, 4, 8); // Longer arms for reach
    const handGeo = new THREE.SphereGeometry(0.2, 8, 6); // Bigger hands for gripping
    const bracerGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.18, 6);
    const leafSmallGeo = new THREE.ConeGeometry(0.06, 0.12, 4);

    const buildOverheadArm = (side: number) => {
      const arm = new THREE.Group();

      const upper = new THREE.Mesh(armGeo, tunicMat);
      makeStroke(upper);
      // Arms raised overhead more extended
      upper.rotation.z = side * Math.PI / 8; // Less angle for more extension
      upper.rotation.x = -Math.PI / 12; // Slight forward lean
      upper.position.set(side * 0.4, 2.2, 0.1); // Higher and more extended
      arm.add(upper);

      const hand = new THREE.Mesh(handGeo, skinMat);
      makeStroke(hand);
      // Hands positioned much higher above head
      hand.position.set(side * 0.7, 3.4, 0.3); // Much higher and more extended
      hand.rotation.x = Math.PI / 6; // Angled to grip bridge
      arm.add(hand);

      /* Visible connection to bridge - rope/cable */
      const connectionGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
      const connection = new THREE.Mesh(connectionGeo, new THREE.MeshToonMaterial({ color: 0x8B4513 }));
      connection.position.set(side * 0.7, 4.0, 0.3); // Above hands, reaching bridge
      arm.add(connection);

      /* bracer */
      const bracer = new THREE.Mesh(bracerGeo, tunicMat);
      makeStroke(bracer);
      bracer.rotation.z = Math.PI / 2;
      bracer.position.set(side * 0.1, 0, 0);
      hand.add(bracer);

      /* bracer leaf accent */
      const leaf = new THREE.Mesh(leafSmallGeo, accentMat);
      leaf.rotation.set(Math.PI, 0, side * Math.PI / 2);
      leaf.position.set(0, 0, 0.12);
      bracer.add(leaf);

      /* Fingers gripping effect */
      for (let i = 0; i < 4; i++) {
        const finger = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.03, 0.15, 3, 4),
          skinMat
        );
        finger.position.set(
          side * 0.05 + (i * 0.03 * side), 
          0.15, 
          0.08 - (i * 0.04)
        );
        finger.rotation.x = -Math.PI / 4; // Curved grip
        makeStroke(finger);
        hand.add(finger);
      }

      return arm;
    };

    this.leftArm  = buildOverheadArm( 1);
    this.rightArm = buildOverheadArm(-1);
    this.group.add(this.leftArm, this.rightArm);

    /* =====================================================================
       LEGS (dangling below, slightly bent)
    ===================================================================== */
    const legGeo  = new THREE.CapsuleGeometry(0.22, 0.5, 4, 8);
    const bootGeo = new THREE.BoxGeometry(0.45, 0.3, 0.35);
    const buildDanglingLeg = (side: number) => {
      const leg = new THREE.Group();

      const thigh = new THREE.Mesh(legGeo, tunicMat);
      makeStroke(thigh);
      // Legs dangling down, slightly bent
      thigh.rotation.x = Math.PI / 12; // Slight bend
      thigh.position.set(side * 0.3, -0.8, 0);
      leg.add(thigh);

      const boot = new THREE.Mesh(bootGeo, bootMat);
      makeStroke(boot);
      boot.scale.set(1.2, 1.1, 1.2);
      boot.position.set(side * 0.3, -1.4, 0.1);
      leg.add(boot);

      /* diamond accent */
      const diaGeo = new THREE.OctahedronGeometry(0.08);
      const diamond = new THREE.Mesh(diaGeo, accentMat);
      diamond.rotation.y = Math.PI / 4;
      diamond.position.set(0, 0.12, 0.22);
      boot.add(diamond);

      return { group: leg, upper: thigh, lower: boot };
    };

    const leftLeg  = buildDanglingLeg( 1);
    const rightLeg = buildDanglingLeg(-1);
    this.group.add(leftLeg.group, rightLeg.group);
    this.legs = [leftLeg, rightLeg];

    /* ---------- ANIMATION CLOCK ---------- */
    this.clock = new THREE.Clock();
  }

  /* =======================================================================
     RUNTIME METHODS
  ======================================================================= */

  update(): boolean {
    if (!this.isHolding) {
      // Falling animation - realistic tumbling fall
      this.group.rotation.x += 0.15;
      this.group.rotation.z += 0.08;
      return true;
    }

    // Intense trembling/struggling animation when holding overhead
    const t = this.clock.getElapsedTime() * 8; // Faster trembling for overhead strain
    const trembleAmount = 0.05; // More intense trembling
    const strainAmount = 0.08; // Strain movement
    
    // Body swaying from strain
    this.group.rotation.z = Math.sin(t) * trembleAmount;
    this.group.position.y += Math.sin(t * 2) * 0.01; // Slight bouncing from strain
    
    // Arms trembling from overhead grip strain
    this.leftArm.rotation.y = Math.sin(t * 1.5) * strainAmount;
    this.rightArm.rotation.y = Math.sin(t * 1.8) * strainAmount;
    
    // Arms slightly adjusting grip position
    this.leftArm.rotation.z = (Math.PI / 6) + Math.sin(t * 2.1) * trembleAmount;
    this.rightArm.rotation.z = (-Math.PI / 6) + Math.sin(t * 2.3) * trembleAmount;
    
    // Legs swaying more dramatically when hanging
    this.legs[0].group.rotation.x = Math.PI / 10 + Math.sin(t * 1.2) * 0.15;
    this.legs[1].group.rotation.x = Math.PI / 10 + Math.sin(t * 1.4) * 0.15;
    
    // Legs swaying side to side
    this.legs[0].group.rotation.z = Math.sin(t * 0.9) * 0.1;
    this.legs[1].group.rotation.z = Math.sin(t * 1.1) * 0.1;

    return true;
  }

  startFalling() {
    this.isHolding = false;
  }

  isCurrentlyHolding(): boolean {
    return this.isHolding;
  }

  play()  { this.clock.start(); }
  pause() { this.clock.stop(); }
}