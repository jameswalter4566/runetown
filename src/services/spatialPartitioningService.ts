// Define Player interface locally to avoid circular dependencies
interface Player {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  targetPosition?: { x: number; y: number; z: number };
  sourcePosition?: { x: number; y: number; z: number };
  movementStartTime?: number;
  direction: string;
  modelType: string;
  lastUpdate: number;
  isMoving?: boolean;
  chatMessage?: string;
  chatTimestamp?: number;
}

// Spatial partitioning for scalable multiplayer
// Divides the world into regions to reduce unnecessary updates
export class SpatialPartitioningService {
  private static instance: SpatialPartitioningService;
  private regionSize = 100; // 100x100 unit regions
  private viewDistance = 150; // Players can see 150 units away
  
  private constructor() {}
  
  static getInstance(): SpatialPartitioningService {
    if (!SpatialPartitioningService.instance) {
      SpatialPartitioningService.instance = new SpatialPartitioningService();
    }
    return SpatialPartitioningService.instance;
  }
  
  // Get region ID for a position
  getRegionId(x: number, z: number): string {
    const regionX = Math.floor(x / this.regionSize);
    const regionZ = Math.floor(z / this.regionSize);
    return `${regionX},${regionZ}`;
  }
  
  // Get all regions visible from a position
  getVisibleRegions(x: number, z: number): string[] {
    const regions: string[] = [];
    const viewRegions = Math.ceil(this.viewDistance / this.regionSize);
    
    const centerRegionX = Math.floor(x / this.regionSize);
    const centerRegionZ = Math.floor(z / this.regionSize);
    
    // Get all regions within view distance
    for (let dx = -viewRegions; dx <= viewRegions; dx++) {
      for (let dz = -viewRegions; dz <= viewRegions; dz++) {
        const regionX = centerRegionX + dx;
        const regionZ = centerRegionZ + dz;
        regions.push(`${regionX},${regionZ}`);
      }
    }
    
    return regions;
  }
  
  // Check if two positions can see each other
  canSeeEachOther(pos1: { x: number; z: number }, pos2: { x: number; z: number }): boolean {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance <= this.viewDistance;
  }
  
  // Filter players by visibility from a position
  filterVisiblePlayers(
    allPlayers: Map<string, Player>,
    viewerPosition: { x: number; z: number },
    excludeId?: string
  ): Player[] {
    const visiblePlayers: Player[] = [];
    
    allPlayers.forEach((player, playerId) => {
      // Skip the viewer
      if (playerId === excludeId) return;
      
      // Check if player is within view distance
      const playerPos = player.targetPosition || player.position;
      if (this.canSeeEachOther(viewerPosition, { x: playerPos.x, z: playerPos.z })) {
        visiblePlayers.push(player);
      }
    });
    
    return visiblePlayers;
  }
  
  // Get update priority based on distance (closer = higher priority)
  getUpdatePriority(viewerPos: { x: number; z: number }, targetPos: { x: number; z: number }): number {
    const dx = viewerPos.x - targetPos.x;
    const dz = viewerPos.z - targetPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Normalize to 0-1 (1 = highest priority)
    return Math.max(0, 1 - (distance / this.viewDistance));
  }
}