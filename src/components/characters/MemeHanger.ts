/* ==========================================================================
   MemeHanger.ts – cartoony "meme guy" character hanging from a bridge
   Update ②: Visible filled mouth + skin‑colored wrists between arms and hands
   ========================================================================== */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export class MemeHanger {
  /* ---------------------------- public fields ---------------------------- */
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  legs: Array<{ group: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh }>;

  /* ----------------------- internal animation state ---------------------- */
  private clock: THREE.Clock;
  private isHolding = true;

  constructor() {
    /* ---------------------------- master group ---------------------------- */
    this.group = new THREE.Group();

    /* ------------------------------ palettes ----------------------------- */
    const skinMat   = new THREE.MeshToonMaterial({ color: 0xffdbac }); // light skin tone
    const shirtMat  = new THREE.MeshToonMaterial({ color: 0x7ed321 }); // lime green tee
    const jeansMat  = new THREE.MeshToonMaterial({ color: 0x3b70ff }); // blue jeans
    const shoeMat   = new THREE.MeshToonMaterial({ color: 0xd97700 }); // orange‑brown
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    /* helper: add black stroke */
    const strokeify = (mesh: THREE.Mesh) => {
      const s = mesh.clone();
      s.material = outlineMat.clone();
      (s.material as THREE.MeshBasicMaterial).side = THREE.BackSide;
      s.scale.multiplyScalar(1.05);
      mesh.add(s);
    };

    /* =====================================================================
       head (oversized, bald, goofy expression)
       ===================================================================== */
    const headGrp = new THREE.Group();
    {
      const headGeo = new RoundedBoxGeometry(1.1, 1.35, 1.1, 8, 0.2);
      const head    = new THREE.Mesh(headGeo, skinMat);
      strokeify(head);
      headGrp.add(head);

      // eyes
      const eyeGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 20);
      const eyeMat = new THREE.MeshToonMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.rotation.x = Math.PI / 2;
      leftEye.position.set(-0.3, 0.1, 0.56);
      headGrp.add(leftEye);
      const rightEye = leftEye.clone();
      rightEye.position.x *= -1;
      headGrp.add(rightEye);

      // brows
      const browGeo = new THREE.PlaneGeometry(0.35, 0.06);
      const browMat = new THREE.MeshToonMaterial({ color: 0x000000 });
      const leftBrow = new THREE.Mesh(browGeo, browMat);
      leftBrow.position.set(-0.28, 0.35, 0.55);
      leftBrow.rotation.z = 0.35;
      headGrp.add(leftBrow);
      const rightBrow = leftBrow.clone();
      rightBrow.position.x *= -1;
      rightBrow.rotation.z *= -1;
      headGrp.add(rightBrow);

      // filled mouth (circle) – more visible than thin ring
      const mouthGeo = new THREE.CircleGeometry(0.14, 20);
      const mouthMat = new THREE.MeshToonMaterial({ color: 0x000000 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0, -0.25, 0.57);
      mouth.rotation.x = Math.PI / 2;
      headGrp.add(mouth);
    }
    headGrp.position.y = 1.7;
    headGrp.scale.set(1.1, 1.1, 1.1);
    this.group.add(headGrp);

    /* =====================================================================
       torso – tee‑shirt block
       ===================================================================== */
    const torsoGeo = new THREE.BoxGeometry(0.9, 1.0, 0.5);
    const torso    = new THREE.Mesh(torsoGeo, shirtMat);
    strokeify(torso);
    torso.position.y = 0.8;
    this.group.add(torso);

    /* =====================================================================
       arms – raised overhead with wrists
       ===================================================================== */
    const upperArmGeo = new THREE.CapsuleGeometry(0.18, 0.7, 4, 8);
    const wristGeo    = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 8);
    const handGeo     = new THREE.SphereGeometry(0.22, 10, 8);

    const buildRaisedArm = (side: number) => {
      const armGrp = new THREE.Group();

      // upper arm (shirt)
      const upper = new THREE.Mesh(upperArmGeo, shirtMat);
      strokeify(upper);
      upper.rotation.z = side * Math.PI / 16;
      upper.position.set(side * 0.45, 2.25, 0.05);
      armGrp.add(upper);

      // wrist connector (skin tone)
      const wrist = new THREE.Mesh(wristGeo, skinMat);
      strokeify(wrist);
      wrist.rotation.z = side * Math.PI / 16;
      wrist.position.set(side * 0.62, 2.9, 0.05);
      armGrp.add(wrist);

      // hand sphere
      const hand = new THREE.Mesh(handGeo, skinMat);
      strokeify(hand);
      hand.position.set(side * 0.75, 3.4, 0.05);
      armGrp.add(hand);

      // fingers – minimal for silhouette
      const fingerGeo = new THREE.CapsuleGeometry(0.04, 0.18, 4, 6);
      for (let i = 0; i < 4; i++) {
        const finger = new THREE.Mesh(fingerGeo, skinMat);
        strokeify(finger);
        finger.position.set(side * (0.03 * i - 0.05), 0.12, 0.12 - 0.03 * i);
        finger.rotation.x = -Math.PI / 3;
        hand.add(finger);
      }

      return armGrp;
    };

    this.leftArm  = buildRaisedArm( 1);
    this.rightArm = buildRaisedArm(-1);
    this.group.add(this.leftArm, this.rightArm);

    /* =====================================================================
       legs – jeans + chunky orange shoes
       ===================================================================== */
    const thighGeo = new THREE.CapsuleGeometry(0.2, 0.55, 4, 8);
    const shoeGeo  = new THREE.BoxGeometry(0.5, 0.3, 0.4);

    const buildLeg = (side: number) => {
      const legGrp = new THREE.Group();

      const thigh = new THREE.Mesh(thighGeo, jeansMat);
      strokeify(thigh);
      thigh.rotation.x = Math.PI / 14;
      thigh.position.set(side * 0.35, -0.1, 0);
      legGrp.add(thigh);

      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      strokeify(shoe);
      shoe.scale.set(1.2, 1.1, 1.1);
      shoe.position.set(side * 0.35, -0.7, 0.1);
      legGrp.add(shoe);

      return { group: legGrp, upper: thigh, lower: shoe };
    };

    const leftLeg  = buildLeg( 1);
    const rightLeg = buildLeg(-1);
    this.group.add(leftLeg.group, rightLeg.group);
    this.legs = [leftLeg, rightLeg];

    /* ------------------------------ clock ------------------------------- */
    this.clock = new THREE.Clock();
  }

  /* =====================================================================
     RUNTIME METHODS
     ===================================================================== */
  update(): boolean {
    if (!this.isHolding) {
      this.group.rotation.x += 0.12;
      this.group.rotation.z += 0.07;
      return true;
    }

    const t = this.clock.getElapsedTime() * 7;
    const tremble = 0.05;

    this.group.rotation.z = Math.sin(t) * tremble;
    this.group.position.y += Math.sin(t * 2) * 0.01;

    this.leftArm.rotation.y  = Math.sin(t * 1.6) * 0.09;
    this.rightArm.rotation.y = Math.sin(t * 1.9) * 0.09;

    this.leftArm.rotation.z  =  Math.PI / 8  + Math.sin(t * 2.0) * tremble;
    this.rightArm.rotation.z = -Math.PI / 8  + Math.sin(t * 2.2) * tremble;

    this.legs[0].group.rotation.x = Math.PI / 10 + Math.sin(t * 1.1) * 0.12;
    this.legs[1].group.rotation.x = Math.PI / 10 + Math.sin(t * 1.3) * 0.12;

    this.legs[0].group.rotation.z = Math.sin(t * 0.8) * 0.09;
    this.legs[1].group.rotation.z = Math.sin(t * 1.0) * 0.09;

    return true;
  }

  /* ------------------------------ controls ----------------------------- */
  startFalling() { this.isHolding = false; }
  isCurrentlyHolding() { return this.isHolding; }
  play()  { this.clock.start(); }
  pause() { this.clock.stop(); }
}