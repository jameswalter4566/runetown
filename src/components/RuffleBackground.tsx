import React, { useEffect, useRef } from 'react';

interface RuffleBackgroundProps {
  swfPath: string;
  onDoorClick?: (doorId: string) => void;
}

declare global {
  interface Window {
    RufflePlayer: any;
  }
}

export const RuffleBackground: React.FC<RuffleBackgroundProps> = ({ swfPath, onDoorClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const isMapFile = swfPath.includes('map.swf');
    
    const loadRuffleEmbed = async () => {
      if (!containerRef.current) return;
      
      // Use embed tag for map.swf to preserve animations
      containerRef.current.innerHTML = '';
      
      const embedElement = document.createElement('embed');
      embedElement.src = swfPath;
      embedElement.type = 'application/x-shockwave-flash';
      embedElement.style.width = '100%';
      embedElement.style.height = '100%';
      embedElement.style.position = 'absolute';
      embedElement.style.top = '0';
      embedElement.style.left = '0';
      embedElement.setAttribute('allowscriptaccess', 'always');
      embedElement.setAttribute('wmode', 'transparent');
      embedElement.setAttribute('quality', 'high');
      embedElement.setAttribute('bgcolor', '#ffffff');
      
      containerRef.current.appendChild(embedElement);
    };
    
    const loadRuffleProgrammatic = async () => {
      if (!containerRef.current) {
        return;
      }
      
      if (!window.RufflePlayer) {
        return;
      }

      try {
        // Create ruffle player
        const ruffle = window.RufflePlayer.newest();
        const player = ruffle.createPlayer();
        
        // Configure player style
        player.style.width = '100%';
        player.style.height = '100%';
        player.style.position = 'absolute';
        player.style.top = '0';
        player.style.left = '0';
        player.style.pointerEvents = 'auto';
        
        // Add player to container
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(player);
        
        // Load the SWF with pointer events enabled
        await player.load({
          url: swfPath,
          autoplay: "on",
          unmuteOverlay: "hidden",
          letterbox: "off",
          scale: "noborder",
          backgroundColor: "#ffffff",
          allowScriptAccess: true,
          wmode: "transparent", // Transparent mode for better interaction
          logLevel: "error",
          contextMenu: false,
          showSwfDownload: false,
          preloader: false,
          splashScreen: false,
          quality: "high",
          salign: "TL",
          menu: false,
          allowFullscreen: false,
          allowNetworking: "none"
        });
        
        // Store reference
        playerRef.current = player;

      } catch (error) {
        // Silent error handling
      }
    };

    // Use embed for map.swf, programmatic for everything else
    if (isMapFile) {
      loadRuffleEmbed();
    } else {
      // Wait for Ruffle to be available
      if (window.RufflePlayer) {
        loadRuffleProgrammatic();
      } else {
        const checkRuffle = setInterval(() => {
          if (window.RufflePlayer) {
            clearInterval(checkRuffle);
            loadRuffleProgrammatic();
          }
        }, 100);

        return () => clearInterval(checkRuffle);
      }
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [swfPath, onDoorClick]);

  return (
    <>
      <style>{`
        ruffle-player::part(unmute-overlay) {
          display: none !important;
        }
        ruffle-player::part(splash-screen) {
          display: none !important;
        }
        ruffle-player {
          --splash-screen-display: none !important;
          --auto-play: true !important;
          --unmute-overlay: hidden !important;
        }
      `}</style>
      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          pointerEvents: 'auto'
        }}
      />
    </>
  );
};