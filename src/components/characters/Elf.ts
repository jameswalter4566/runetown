/* Elf.ts – chibi-style cartoon elf archer (3-D)                     */
/* ---------------------------------------------------------------- *
   Drop this file into your project, compile, and the model you get
   should closely match the 2-D concept art: big round head, black
   eyes, flared tunic, chunky boots, teal accents, etc.
* ---------------------------------------------------------------- */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export class Elf {
  /* ---------------------------- public fields ---------------------------- */
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  bow: THREE.Group;
  hipAnchor: THREE.Group;
  legs: Array<{ group: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh }>;
  /* ----------------------- internal animation state ---------------------- */
  private clock: THREE.Clock;
  private speed = 2.2;
  private stepAngle = Math.PI / 6;
  private isPlaying = false;

  constructor() {
    /* ---------- MASTER GROUP ---------- */
    this.group = new THREE.Group();

    /* ---------- MATERIALS ---------- */
    const skinMat   = new THREE.MeshToonMaterial({ color: 0xffe4c4 }); // fair
    const tunicMat  = new THREE.MeshToonMaterial({ color: 0x228b22 }); // forest
    const bootMat   = new THREE.MeshToonMaterial({ color: 0x8b4513 }); // brown
    const hairMat   = new THREE.MeshToonMaterial({ color: 0xffd700 }); // gold
    const bowMat    = new THREE.MeshToonMaterial({ color: 0x8b7355 }); // wood
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
       HEAD  (rounded box + black eyes + bangs)
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

      /* big black cylindrical eyes */
      const eyeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16);
      const eyeMat = new THREE.MeshToonMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.rotation.x = Math.PI / 2;
      leftEye.position.set(-0.25, 0.15, 0.52);
      headGroup.add(leftEye);

      const rightEye = leftEye.clone();
      rightEye.position.x *= -1;
      headGroup.add(rightEye);

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
       ARMS  (capsule + hand + bracer + leaf accent)
    ===================================================================== */
    const armGeo  = new THREE.CapsuleGeometry(0.18, 0.5, 4, 8);
    const handGeo = new THREE.SphereGeometry(0.18, 8, 6);
    const bracerGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.18, 6);
    const leafSmallGeo = new THREE.ConeGeometry(0.06, 0.12, 4);

    const buildArm = (side: number) => {
      const arm = new THREE.Group();

      const upper = new THREE.Mesh(armGeo, tunicMat);
      makeStroke(upper);
      upper.rotation.z = side * Math.PI / 4;
      upper.position.set(side * 0.7, 0.5, 0);
      arm.add(upper);

      const hand = new THREE.Mesh(handGeo, skinMat);
      makeStroke(hand);
      hand.position.set(side * 0.9, 0, 0);
      arm.add(hand);

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

      return arm;
    };

    this.leftArm  = buildArm( 1);
    this.rightArm = buildArm(-1);
    this.group.add(this.leftArm, this.rightArm);

    /* =====================================================================
       BOW  (fatter arc, black string, arrow)
    ===================================================================== */
    this.bow = new THREE.Group();
    {
      /* bow arc */
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.8, 0),
        new THREE.Vector3(0.25, -0.4, 0),
        new THREE.Vector3(0.3,  0,   0),
        new THREE.Vector3(0.25,  0.4, 0),
        new THREE.Vector3(0,  0.8, 0)
      ]);
      const bowGeo = new THREE.TubeGeometry(curve, 20, 0.06, 8, false);
      const bowMesh = new THREE.Mesh(bowGeo, bowMat);
      bowMesh.scale.set(1.15, 1.15, 1.15);
      makeStroke(bowMesh);
      this.bow.add(bowMesh);

      /* black string */
      const stringGeo = new THREE.TubeGeometry(
        new THREE.LineCurve3(
          new THREE.Vector3(0, -0.78, 0),
          new THREE.Vector3(0,  0.78, 0)
        ),
        1, 0.012, 4, false
      );
      const stringMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      this.bow.add(new THREE.Mesh(stringGeo, stringMat));

      /* arrow shaft */
      const arrowGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.0);
      const arrow = new THREE.Mesh(arrowGeo, bowMat);
      arrow.rotation.z = Math.PI / 2;
      arrow.position.set(-0.35, 0, 0);
      this.bow.add(arrow);

      /* arrowhead */
      const arrowHeadGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
      const arrowHead = new THREE.Mesh(arrowHeadGeo, outlineMat);
      arrowHead.rotation.z = -Math.PI / 2;
      arrowHead.position.set(-0.9, 0, 0);
      this.bow.add(arrowHead);
    }

    /* hip holster */
    this.hipAnchor = new THREE.Group();
    this.hipAnchor.position.set(0.35, 0.05, 0.05); // right hip
    torso.add(this.hipAnchor);

    /* stow bow initially */
    this.bow.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    this.bow.position.set(0, -0.45, 0);
    this.hipAnchor.add(this.bow);

    /* =====================================================================
       LEGS (capsule thigh + beefy boot + diamond accent)
    ===================================================================== */
    const legGeo  = new THREE.CapsuleGeometry(0.22, 0.5, 4, 8);
    const bootGeo = new THREE.BoxGeometry(0.45, 0.3, 0.35);
    const buildLeg = (side: number) => {
      const leg = new THREE.Group();

      const thigh = new THREE.Mesh(legGeo, tunicMat);
      makeStroke(thigh);
      thigh.position.set(side * 0.3, -0.6, 0);
      leg.add(thigh);

      const boot = new THREE.Mesh(bootGeo, bootMat);
      makeStroke(boot);
      boot.scale.set(1.2, 1.1, 1.2);
      boot.position.set(side * 0.3, -1.2, 0.1);
      leg.add(boot);

      /* diamond accent */
      const diaGeo = new THREE.OctahedronGeometry(0.08);
      const diamond = new THREE.Mesh(diaGeo, accentMat);
      diamond.rotation.y = Math.PI / 4;
      diamond.position.set(0, 0.12, 0.22);
      boot.add(diamond);

      return { group: leg, upper: thigh, lower: boot };
    };

    const leftLeg  = buildLeg( 1);
    const rightLeg = buildLeg(-1);
    this.group.add(leftLeg.group, rightLeg.group);
    this.legs = [leftLeg, rightLeg];

    /* ---------- ANIMATION CLOCK ---------- */
    this.clock = new THREE.Clock();
  }

  /* =======================================================================
     RUNTIME METHODS
  ======================================================================= */

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

    /* subtle bow sway */
    this.bow.rotation.y = Math.sin(t * 0.5) * 0.1;

    return true;
  }

  play()  { this.isPlaying = true;  this.clock.start(); }
  pause() { this.isPlaying = false; this.clock.stop();  }

  /* ---------- quick equip / stow ---------- */
  equipBow = () => {
    this.group.attach(this.bow);      // detach from hip
    this.leftArm.add(this.bow);       // into hand
    this.bow.rotation.set(0, 0, Math.PI / 6);
    this.bow.position.set(0.6, 0.2, 0.3);
  };

  stowBow = () => {
    this.group.attach(this.bow);      // detach from hand
    this.hipAnchor.add(this.bow);     // back to hip
    this.bow.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    this.bow.position.set(0, -0.45, 0);
  };
}