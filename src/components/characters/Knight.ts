/* Knight.ts - drop-in module that builds + animates a chunky cartoon knight
   HOW TO USE:
   import { Knight } from './Knight';
   const knight = new Knight();
   scene.add(knight.group);
   knight.play();   // starts walk loop – call this AFTER your render loop is running
*/

import * as THREE from 'three';

// This is the original Knight class implementation with THREE.js geometry
// It does NOT rely on external model files

export class Knight {
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

    /* ---------- MATERIALS (flat toon colors) ---------- */
    const bodyMat  = new THREE.MeshToonMaterial({ color: 0xb4bdbb }); // armor
    const beltMat  = new THREE.MeshToonMaterial({ color: 0xefb64d });
    const bootMat  = new THREE.MeshToonMaterial({ color: 0xd28f1b });
    const plumeMat = new THREE.MeshToonMaterial({ color: 0xc53d32 });
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    /* ---------- UTILITY: add black "ink" outline ---------- */
    const makeStroke = (mesh: THREE.Mesh) => {
      const stroke = mesh.clone();
      stroke.material = outlineMat.clone();
      (stroke.material as THREE.MeshBasicMaterial).side = THREE.BackSide;
      stroke.scale.multiplyScalar(1.06);
      mesh.add(stroke);
    };

    /* ---------- HELMET ---------- */
    const helmet = new THREE.Group();
    {
      const helmGeo = new THREE.BoxGeometry(1.4, 1.25, 1.2).toNonIndexed();
      helmGeo.computeVertexNormals();
      const helm = new THREE.Mesh(helmGeo, bodyMat);
      makeStroke(helm);
      helmet.add(helm);

      /* visor slit plate */
      const visorGeo = new THREE.BoxGeometry(1.1, 0.4, 0.15);
      const visor = new THREE.Mesh(visorGeo, bodyMat);
      visor.position.set(0, 0.15, 0.63);
      makeStroke(visor);
      helmet.add(visor);

      /* visor holes (simple textures would be nicer; boxes suffice for proto) */
      const holeGeo = new THREE.BoxGeometry(0.1, 0.15, 0.2);
      const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      for (let i = -1; i <= 1; i++) {
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(i * 0.35, 0.15, 0.71);
        helmet.add(hole);
      }

      /* plume */
      const plumeGeo = new THREE.CapsuleGeometry(0.15, 0.8, 4, 8);
      const plume = new THREE.Mesh(plumeGeo, plumeMat);
      plume.rotation.set(Math.PI * 0.2, 0, Math.PI * 0.1);
      plume.position.set(-0.35, 0.8, -0.1);
      makeStroke(plume);
      helmet.add(plume);
    }
    helmet.position.y = 1.55;
    this.group.add(helmet);

    /* ---------- TORSO ---------- */
    const torsoGeo = new THREE.CapsuleGeometry(0.8, 0.8, 4, 10);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    makeStroke(torso);
    torso.position.y = 0.7;
    this.group.add(torso);

    /* ---------- BELT ---------- */
    {
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.11, 8, 24), beltMat);
      belt.rotation.x = Math.PI / 2;
      belt.position.y = 0.1;
      makeStroke(belt);

      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.05), beltMat);
      buckle.position.set(0, 0, 0.82);
      makeStroke(buckle);

      torso.add(belt, buckle);
    }

    /* ---------- ARMS ---------- */
    const armGeo = new THREE.CapsuleGeometry(0.25, 0.4, 4, 8);
    const handGeo = new THREE.SphereGeometry(0.25, 8, 6);

    const buildArm = (side: number) => {
      const arm = new THREE.Group();
      const upper = new THREE.Mesh(armGeo, bodyMat);
      makeStroke(upper);
      const hand = new THREE.Mesh(handGeo, bodyMat);
      makeStroke(hand);

      upper.rotation.z = side * Math.PI / 2.2;
      upper.position.set(side * 1.05, 0.6, 0);
      hand.position.set(side * 1.05, 0.15, 0);

      arm.add(upper, hand);
      return arm;
    };

    this.leftArm  = buildArm(1);
    this.rightArm = buildArm(-1);
    this.group.add(this.leftArm, this.rightArm);

    /* ---------- LEGS ---------- */
    const legGeo = new THREE.CapsuleGeometry(0.28, 0.5, 4, 8);
    const footGeo = new THREE.BoxGeometry(0.7, 0.25, 0.35);

    const buildLeg = (side: number) => {
      const leg = new THREE.Group();
      const thigh = new THREE.Mesh(legGeo, bodyMat);  
      makeStroke(thigh);
      const boot  = new THREE.Mesh(footGeo, bootMat); 
      makeStroke(boot);

      thigh.position.set(side * 0.45, -0.6, 0);
      boot.position.set(side * 0.45, -1.25, 0.15);

      leg.add(thigh, boot);
      return { group: leg, upper: thigh, lower: boot };
    };

    const L = buildLeg(1);  
    const R = buildLeg(-1);
    this.group.add(L.group, R.group);
    this.legs = [L, R];

    /* ---------- ANIMATION DATA ---------- */
    this.clock = new THREE.Clock();
    this.speed = 2.0;               // steps per second
    this.stepAngle = Math.PI / 5;   // how far limbs swing
  }

  /* call each frame – returns false if not yet started */
  update(): boolean {
    if (!this.isPlaying) return false;

    const t = this.clock.getElapsedTime() * this.speed * Math.PI;
    
    /* arms & legs opposite phase */
    const swing = (limb: THREE.Group, phase: number) => {
      limb.rotation.x = Math.sin(t + phase) * this.stepAngle;
    };

    swing(this.leftArm, 0);
    swing(this.rightArm, Math.PI);
    swing(this.legs[0].group, Math.PI);
    swing(this.legs[1].group, 0);

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