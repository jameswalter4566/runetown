// Grid system utilities for consistent positioning across all players
export const GRID_SIZE = 0.1; // Grid unit size
export const POSITION_PRECISION = 2; // Decimal places for position

// Snap position to grid
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

// Round position to consistent precision
export function roundPosition(value: number): number {
  return Math.round(value * Math.pow(10, POSITION_PRECISION)) / Math.pow(10, POSITION_PRECISION);
}

// Normalize position for network transmission
export function normalizePosition(position: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  return {
    x: roundPosition(position.x),
    y: roundPosition(position.y),
    z: roundPosition(position.z)
  };
}

// Calculate distance between two positions
export function getDistance(pos1: { x: number; z: number }, pos2: { x: number; z: number }): number {
  const dx = pos2.x - pos1.x;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// Predict future position based on velocity
export function predictPosition(
  currentPos: { x: number; z: number },
  targetPos: { x: number; z: number },
  velocity: number,
  deltaTime: number
): { x: number; z: number } {
  const dx = targetPos.x - currentPos.x;
  const dz = targetPos.z - currentPos.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  if (distance < 0.01) return currentPos;
  
  const moveDistance = velocity * deltaTime;
  const moveRatio = Math.min(moveDistance / distance, 1);
  
  return {
    x: currentPos.x + dx * moveRatio,
    z: currentPos.z + dz * moveRatio
  };
}