import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface MinimapProps {
  playerPosition: THREE.Vector3;
  playerRotation: number;
  mapScale?: number;
}

const Minimap: React.FC<MinimapProps> = ({ playerPosition, playerRotation, mapScale = 0.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Set center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Rotate the entire map based on player rotation
    ctx.translate(centerX, centerY);
    ctx.rotate(-playerRotation - Math.PI / 2); // Negative rotation to make map spin opposite to player
    ctx.translate(-centerX, -centerY);
    
    // Draw map background with solid color to match UI
    ctx.fillStyle = '#2B2B2B'; // Dark background to match the UI
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add a subtle inner glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width/2);
    gradient.addColorStop(0, 'rgba(34, 139, 34, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw map features
    // Grand Exchange (center platform)
    const geSize = 30 * mapScale;
    ctx.fillStyle = 'rgba(160, 82, 45, 0.8)'; // Brown
    ctx.fillRect(centerX - geSize/2, centerY - geSize/2, geSize, geSize);
    
    // Draw some landmark features
    // North path
    ctx.fillStyle = 'rgba(139, 69, 19, 0.6)';
    ctx.fillRect(centerX - 5, centerY - 60, 10, 50);
    
    // East path
    ctx.fillRect(centerX + 10, centerY - 5, 50, 10);
    
    // South path
    ctx.fillRect(centerX - 5, centerY + 10, 10, 50);
    
    // West path
    ctx.fillRect(centerX - 60, centerY - 5, 50, 10);
    
    // Draw grid lines for reference
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 20) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }
    
    // Restore context state
    ctx.restore();
    
    // Draw player marker (always centered and pointing up)
    ctx.fillStyle = '#ff0000';
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Draw player as a triangle pointing in movement direction
    ctx.beginPath();
    ctx.moveTo(0, -8); // Top point
    ctx.lineTo(-5, 5); // Bottom left
    ctx.lineTo(5, 5); // Bottom right
    ctx.closePath();
    ctx.fill();
    
    // Draw player dot in center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Draw compass directions (these rotate with the map)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-playerRotation - Math.PI / 2);
    
    // North marker
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -canvas.height/2 + 20);
    
    ctx.restore();
    
  }, [playerPosition, playerRotation, mapScale]);
  
  return (
    <canvas 
      ref={canvasRef}
      width={200}
      height={200}
      className="absolute"
      style={{
        borderRadius: '50%',
        backgroundColor: 'transparent',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        border: '2px solid rgba(0, 0, 0, 0.3)'
      }}
    />
  );
};

export default Minimap;