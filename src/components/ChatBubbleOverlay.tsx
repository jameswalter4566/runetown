import React, { useEffect, useState, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ChatBubbleOverlayProps {
  playerPosition: THREE.Vector3;
  message: string | null;
  onHide: () => void;
}

export const ChatBubbleOverlay: React.FC<ChatBubbleOverlayProps> = ({ 
  playerPosition, 
  message, 
  onHide 
}) => {
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const { camera, gl } = useThree();
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      
      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Hide after 5 seconds
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        onHide();
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message, onHide]);

  useEffect(() => {
    if (!isVisible || !message) return;

    const updateScreenPosition = () => {
      // Create a vector above the player's head
      const worldPosition = new THREE.Vector3(
        playerPosition.x,
        playerPosition.y + 4, // Above the player's head
        playerPosition.z
      );

      // Project to screen coordinates
      const screenPos = worldPosition.clone().project(camera);
      
      // Convert to pixel coordinates
      const canvas = gl.domElement;
      const x = (screenPos.x * 0.5 + 0.5) * canvas.clientWidth;
      const y = (screenPos.y * -0.5 + 0.5) * canvas.clientHeight;
      
      setScreenPosition({ x, y });
    };

    // Update position every frame
    const interval = setInterval(updateScreenPosition, 16); // ~60fps
    updateScreenPosition(); // Initial update

    return () => clearInterval(interval);
  }, [playerPosition, camera, gl, isVisible, message]);

  if (!isVisible || !message) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: screenPosition.x,
        top: screenPosition.y,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
        pointerEvents: 'none',
        fontFamily: "'Pixelify Sans', monospace",
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#FFFF00',
        textShadow: `
          -1px -1px 0 #000,
          1px -1px 0 #000,
          -1px 1px 0 #000,
          1px 1px 0 #000,
          -2px 0 0 #000,
          2px 0 0 #000,
          0 -2px 0 #000,
          0 2px 0 #000
        `,
        whiteSpace: 'nowrap',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      {message}
    </div>
  );
};

export default ChatBubbleOverlay;