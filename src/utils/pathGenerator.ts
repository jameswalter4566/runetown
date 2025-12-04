import * as THREE from 'three';

export interface PathPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  progress: number; // 0 to 1
}

/**
 * Generates a path of coordinates from start to destination
 * This ensures every single coordinate is streamed to other players
 */
export function generateMovementPath(
  start: { x: number; z: number },
  destination: { x: number; z: number },
  moveSpeed: number = 15, // units per second
  updateRate: number = 30 // updates per second (30Hz)
): PathPoint[] {
  const path: PathPoint[] = [];
  
  // Calculate total distance
  const dx = destination.x - start.x;
  const dz = destination.z - start.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  if (distance < 0.01) {
    // No movement needed
    return [{
      x: start.x,
      y: 0,
      z: start.z,
      timestamp: Date.now(),
      progress: 1
    }];
  }
  
  // Calculate travel time
  const travelTime = distance / moveSpeed; // seconds
  const totalUpdates = Math.ceil(travelTime * updateRate);
  const timeStep = (travelTime * 1000) / totalUpdates; // milliseconds between updates
  
  // Generate path points
  const startTime = Date.now();
  
  for (let i = 0; i <= totalUpdates; i++) {
    const progress = i / totalUpdates;
    
    // Interpolate position
    const point: PathPoint = {
      x: start.x + dx * progress,
      y: 0,
      z: start.z + dz * progress,
      timestamp: startTime + (i * timeStep),
      progress
    };
    
    path.push(point);
  }
  
  // Ensure final position is exact
  path[path.length - 1] = {
    x: destination.x,
    y: 0,
    z: destination.z,
    timestamp: startTime + (travelTime * 1000),
    progress: 1
  };
  
  console.log(`[PathGenerator] Generated path with ${path.length} points:`, {
    start: `(${start.x.toFixed(1)}, ${start.z.toFixed(1)})`,
    destination: `(${destination.x.toFixed(1)}, ${destination.z.toFixed(1)})`,
    distance: distance.toFixed(1),
    travelTime: travelTime.toFixed(2) + 's',
    updateRate: updateRate + 'Hz'
  });
  
  return path;
}

/**
 * Calculates the direction string based on movement vector
 */
export function getDirectionFromMovement(dx: number, dz: number): string {
  if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) return 'S'; // Default to South if not moving
  
  const angle = Math.atan2(dx, dz);
  const normalized = ((angle + Math.PI) / (2 * Math.PI)) * 8;
  const index = Math.round(normalized) % 8;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  
  return directions[index];
}