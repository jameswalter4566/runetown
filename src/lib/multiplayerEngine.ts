/**
 * Multiplayer Engine with Client-Side Prediction, Server Reconciliation, and Interpolation
 * Based on industry best practices for real-time multiplayer games
 */

import { normalizePosition } from '@/utils/gridSystem';
import { NAVBAR_Z } from '@/constants';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface PlayerInput {
  sequenceNumber: number;
  targetPosition: Vector3 | null;
  timestamp: number;
}

interface ServerUpdate {
  position: Vector3;
  direction: number;
  velocity: Vector3;
  lastProcessedInput: number;
  timestamp: number;
}

interface InterpolationState {
  from: Vector3;
  to: Vector3;
  startTime: number;
  duration: number;
}

export class PlayerController {
  // Client-side prediction state
  private position: Vector3;
  private velocity: Vector3;
  private direction: number;
  private targetPosition: Vector3 | null;
  
  // Server reconciliation
  private inputSequenceNumber: number = 0;
  private pendingInputs: PlayerInput[] = [];
  private lastServerUpdate: ServerUpdate | null = null;
  
  // Interpolation for smooth rendering
  private interpolationState: InterpolationState | null = null;
  private renderPosition: Vector3;
  
  // Movement settings
  private readonly MOVE_SPEED = 0.15; // Units per frame (not per second!) - matches single-player
  private readonly INTERPOLATION_DELAY = 50; // Reduced from 100ms for faster visual updates

  // Anti-stuck parameters - more sensitive detection
  private lastSample = { x: 0, z: 0 };
  private stuckTime = 0;
  private static readonly STUCK_DIST = 0.025; // metres moved ≈ none (more sensitive)
  private static readonly STUCK_TIMEOUT = 0.20; // seconds before nudge (faster response)
  private static readonly NUDGE = 0.6; // stronger nudge – 0.6 m & random ±90°
  
  // Simple floor height detection
  private getFloorHeight(x: number, z: number): number {
    // Check if we're on the map model area (roughly center area)
    const centerDist = Math.sqrt(x * x + z * z);
    if (centerDist < 60) {
      // On the map model, floor is at y=-7 (map position) + proper offset for player feet
      // With player model offset of -8, we need to compensate
      return 2; // This puts the player's feet on the map surface
    }
    // On the green ground plane
    return 0;
  }
  
  constructor(initialPosition: Vector3) {
    this.position = { ...initialPosition };
    
    // Set Y position based on floor
    this.position.y = this.getFloorHeight(this.position.x, this.position.z);
    
    this.renderPosition = { ...this.position };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.direction = 0;
    this.targetPosition = null;
  }
  
  /**
   * Process local input with client-side prediction
   */
  processInput(targetPos: Vector3 | null): PlayerInput {
    this.inputSequenceNumber++;
    
    const input: PlayerInput = {
      sequenceNumber: this.inputSequenceNumber,
      targetPosition: targetPos, // REMOVED normalizePosition - was causing sticking
      timestamp: Date.now()
    };
    
    // Store input for reconciliation
    this.pendingInputs.push(input);
    
    // Apply input immediately (client-side prediction)
    this.applyInput(input);
    
    return input;
  }
  
  /**
   * Apply input to update position
   */
  private applyInput(input: PlayerInput) {
    // Log new target position for debugging
    if (input.targetPosition) {
      console.log('Setting new target:', input.targetPosition.x.toFixed(2), input.targetPosition.z.toFixed(2));
    }
    this.targetPosition = input.targetPosition;
  }
  
  /**
   * Update physics simulation
   */
  update(deltaTime: number) {
    if (!this.targetPosition) {
      this.velocity = { x: 0, y: 0, z: 0 };
      return;
    }
    // Removed per-frame logging for smoother movement
    const dx = this.targetPosition.x - this.position.x;
    const dz = this.targetPosition.z - this.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.15) { // Increased threshold for smoother stopping
      // Reached target: snap exactly to target and stop
      console.log('Reached target at:', this.targetPosition.x.toFixed(2), this.targetPosition.z.toFixed(2));
      this.position = { ...this.targetPosition };
      
      // Update Y position based on floor
      this.position.y = this.getFloorHeight(this.position.x, this.position.z);
      
      this.velocity = { x: 0, y: 0, z: 0 };
      this.targetPosition = null;
    } else {
      // Move towards target - use fixed step size per frame like single-player
      const step = Math.min(this.MOVE_SPEED, distance);
      this.velocity = {
        x: (dx / distance) * this.MOVE_SPEED,
        y: 0,
        z: (dz / distance) * this.MOVE_SPEED
      };
      let nextX = this.position.x + (dx / distance) * step;
      let nextZ = this.position.z + (dz / distance) * step;

      // Check green floor boundaries (250x250 plane)
      const FLOOR_LIMIT = 245; // Slightly less than 250 to prevent edge clipping
      nextX = Math.max(-FLOOR_LIMIT, Math.min(FLOOR_LIMIT, nextX));
      nextZ = Math.max(-FLOOR_LIMIT, Math.min(FLOOR_LIMIT, nextZ));
      
      // If we hit the boundary, stop movement
      if (nextX === -FLOOR_LIMIT || nextX === FLOOR_LIMIT || 
          nextZ === -FLOOR_LIMIT || nextZ === FLOOR_LIMIT) {
        this.velocity = { x: 0, y: 0, z: 0 };
        this.targetPosition = null;
      }

      // 2️⃣ Accept move
      this.position.x = nextX;
      this.position.z = nextZ;
      this.direction = Math.atan2(dx, dz);
      
      // Update Y position based on floor
      this.position.y = this.getFloorHeight(this.position.x, this.position.z);

      // ─── Anti-stuck nudge ──────────────────────────────
      const moved = Math.hypot(
        this.position.x - this.lastSample.x,
        this.position.z - this.lastSample.z
      );
      if (moved < PlayerController.STUCK_DIST) {
        this.stuckTime += deltaTime;
        if (this.stuckTime > PlayerController.STUCK_TIMEOUT) {
          // random ±90° nudge 40 cm
          const sign = Math.random() < 0.5 ? -1 : 1;
          const perp = { x: -this.velocity.z * sign, z: this.velocity.x * sign };
          const len = Math.hypot(perp.x, perp.z) || 1;
          let nudgeX = this.position.x + (perp.x / len) * PlayerController.NUDGE;
          let nudgeZ = this.position.z + (perp.z / len) * PlayerController.NUDGE;
          
          // Apply floor boundaries to nudge as well
          const FLOOR_LIMIT = 245;
          nudgeX = Math.max(-FLOOR_LIMIT, Math.min(FLOOR_LIMIT, nudgeX));
          nudgeZ = Math.max(-FLOOR_LIMIT, Math.min(FLOOR_LIMIT, nudgeZ));
          
          this.position.x = nudgeX;
          this.position.z = nudgeZ;
          this.stuckTime = 0;
        }
      } else {
        this.stuckTime = 0;
        this.lastSample = { x: this.position.x, z: this.position.z };
      }
    }
    
    // DISABLED - This was causing movement sticking issues
    // this.position = normalizePosition(this.position);
  }
  
  /**
   * Receive server update and reconcile
   */
  receiveServerUpdate(update: ServerUpdate) {
    this.lastServerUpdate = update;
    
    // Start interpolation for smooth visual correction
    this.interpolationState = {
      from: { ...this.renderPosition },
      to: update.position,
      startTime: Date.now(),
      duration: this.INTERPOLATION_DELAY
    };
    
    // Server Reconciliation
    // 1. Set position to server's authoritative position
    const oldPosition = { ...this.position };
    this.position = { ...update.position };
    this.velocity = { ...update.velocity };
    this.direction = update.direction;
    
    // 2. Remove acknowledged inputs
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequenceNumber > update.lastProcessedInput
    );
    
    // 3. Re-apply unacknowledged inputs
    const currentTime = Date.now();
    for (const input of this.pendingInputs) {
      this.applyInput(input);
      // For frame-based movement, just apply one frame of movement per input
      this.update(1);
    }
    
    // If position changed significantly, log it for debugging
    const correction = Math.sqrt(
      Math.pow(this.position.x - oldPosition.x, 2) +
      Math.pow(this.position.z - oldPosition.z, 2)
    );
    
    if (correction > 0.5) {
      console.log(`Server reconciliation: corrected position by ${correction.toFixed(2)} units`);
    }
  }
  
  /**
   * Get interpolated position for rendering
   */
  getRenderPosition(): Vector3 {
    if (!this.interpolationState) {
      this.renderPosition = { ...this.position };
      return this.renderPosition;
    }
    
    const now = Date.now();
    const elapsed = now - this.interpolationState.startTime;
    const t = Math.min(elapsed / this.interpolationState.duration, 1);
    
    // Smooth interpolation using ease-out curve
    const easeT = 1 - Math.pow(1 - t, 3);
    
    this.renderPosition = {
      x: this.interpolationState.from.x + 
         (this.interpolationState.to.x - this.interpolationState.from.x) * easeT,
      y: this.interpolationState.from.y + 
         (this.interpolationState.to.y - this.interpolationState.from.y) * easeT,
      z: this.interpolationState.from.z + 
         (this.interpolationState.to.z - this.interpolationState.from.z) * easeT
    };
    
    // Clear interpolation when done
    if (t >= 1) {
      this.interpolationState = null;
    }
    
    return this.renderPosition;
  }
  
  /**
   * Get current state for network transmission
   */
  getState() {
    return {
      position: this.position,
      velocity: this.velocity,
      direction: this.direction,
      isMoving: this.targetPosition !== null,
      sequenceNumber: this.inputSequenceNumber
    };
  }
}

/**
 * Remote player controller with interpolation and extrapolation
 */
export class RemotePlayerController {
  private positionBuffer: Array<{ position: Vector3; timestamp: number }> = [];
  private currentPosition: Vector3;
  private renderPosition: Vector3;
  private direction: number = 0;
  private velocity: Vector3 = { x: 0, y: 0, z: 0 };
  
  // Interpolation settings
  private readonly INTERPOLATION_BUFFER_SIZE = 3; // Reduced for more responsive updates
  private readonly INTERPOLATION_DELAY = 30; // ms - further reduced for less lag
  private readonly EXTRAPOLATION_LIMIT = 50; // ms - prevent large position jumps
  
  constructor(initialPosition: Vector3) {
    this.currentPosition = { ...initialPosition };
    this.renderPosition = { ...initialPosition };
  }
  
  /**
   * Receive position update from network
   */
  receiveUpdate(position: Vector3, direction: number, velocity: Vector3, timestamp: number) {
    // Add to buffer - removed normalizePosition to avoid snapping that causes sticking
    this.positionBuffer.push({
      position: { ...position },
      timestamp
    });
    
    // Keep buffer size limited
    if (this.positionBuffer.length > this.INTERPOLATION_BUFFER_SIZE) {
      this.positionBuffer.shift();
    }
    
    // Removed normalizePosition to avoid snapping that causes sticking
    this.currentPosition = { ...position };
    this.direction = direction;
    this.velocity = velocity;
  }
  
  /**
   * Get interpolated/extrapolated position for rendering
   */
  getRenderPosition(currentTime: number): Vector3 {
    if (this.positionBuffer.length < 2) {
      return this.currentPosition;
    }
    
    // Render with interpolation delay
    const renderTime = currentTime - this.INTERPOLATION_DELAY;
    
    // Find the two positions to interpolate between
    let from = this.positionBuffer[0];
    let to = this.positionBuffer[0];
    
    for (let i = 1; i < this.positionBuffer.length; i++) {
      if (this.positionBuffer[i].timestamp <= renderTime) {
        from = this.positionBuffer[i];
      } else {
        to = this.positionBuffer[i];
        break;
      }
    }
    
    // If we're rendering a time after our latest update, extrapolate
    if (renderTime > this.positionBuffer[this.positionBuffer.length - 1].timestamp) {
      const latestUpdate = this.positionBuffer[this.positionBuffer.length - 1];
      const extrapolationTime = Math.min(
        renderTime - latestUpdate.timestamp,
        this.EXTRAPOLATION_LIMIT
      );
      
      // Extrapolate using velocity
      this.renderPosition = {
        x: latestUpdate.position.x + this.velocity.x * (extrapolationTime / 1000),
        y: latestUpdate.position.y + this.velocity.y * (extrapolationTime / 1000),
        z: latestUpdate.position.z + this.velocity.z * (extrapolationTime / 1000)
      };
    } else {
      // Interpolate between two known positions
      const duration = to.timestamp - from.timestamp;
      if (duration === 0) {
        this.renderPosition = from.position;
      } else {
        const t = (renderTime - from.timestamp) / duration;
        const smoothT = t * t * (3 - 2 * t); // Smooth step function
        
        this.renderPosition = {
          x: from.position.x + (to.position.x - from.position.x) * smoothT,
          y: from.position.y + (to.position.y - from.position.y) * smoothT,
          z: from.position.z + (to.position.z - from.position.z) * smoothT
        };
      }
    }
    
    return this.renderPosition; // REMOVED normalizePosition - was causing sticking
  }
  
  getDirection(): number {
    return this.direction;
  }
}