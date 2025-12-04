import React, { useState } from 'react';
import { RuffleBackground } from './RuffleBackground';

// TypeScript declaration for ruffle-player custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ruffle-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        autoplay?: string;
        unmuteOverlay?: string;
        letterbox?: string;
        scale?: string;
        backgroundColor?: string;
        allowScriptAccess?: string;
        wmode?: string;
        quality?: string;
        menu?: string;
        allowFullscreen?: string;
        allowNetworking?: string;
      };
    }
  }
}

type MapArea = 'town' | 'stadium' | 'plaza' | 'forest' | 'cove' | 'mineshack' | 'coffeeshop' | 'nightclub' | 'giftshop' | 'dock' | 'forts';

interface MapInterfaceProps {
  currentMap: MapArea;
  onMapSelect: (mapName: MapArea, entryPoint: 'fromLeft' | 'fromRight' | 'fromTop' | 'fromBottom' | 'fromTopLeft' | 'fromTopRight' | 'fromBottomLeft' | 'fromBottomRight') => void;
}

export const MapInterface: React.FC<MapInterfaceProps> = ({ currentMap, onMapSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  const handleMapClick = () => {
    setIsMapOpen(true);
    setShowLoading(true);
    // Hide loading indicator after 3 seconds to allow interaction
    setTimeout(() => setShowLoading(false), 3000);
  };

  const handleCloseMap = () => {
    setIsMapOpen(false);
    setShowLoading(true);
  };

  return (
    <>
      {/* Map Icon - Bottom Left Corner of game screen, above navbar */}
      <div 
        className="absolute left-4 cursor-pointer select-none ui-layer"
        onClick={(e) => {
          e.stopPropagation();
          handleMapClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          bottom: '88px',  // Just above the 80px navbar with small gap
          width: '80px', 
          height: '80px',
          pointerEvents: 'auto',
          zIndex: 200
        }}
      >
        <img 
          src={isHovered ? "/map-open.png" : "/map-closed.png"}
          alt="Map"
          className="w-full h-full object-contain transition-all duration-200 hover:scale-110"
          draggable={false}
        />
      </div>

      {/* Map Modal with SWF */}
      {isMapOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center ui-layer"
          style={{ zIndex: 1000 }}
          onClick={(e) => {
            e.stopPropagation();
            handleCloseMap();
          }}
        >
          <div 
            className="relative bg-blue-900 rounded-lg border-4 border-blue-600 shadow-2xl"
            style={{ 
              width: '90vw', 
              height: '85vh',
              maxWidth: '1200px',
              maxHeight: '800px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseMap();
              }}
              className="absolute top-4 right-4 text-white hover:text-red-400 text-3xl font-bold z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center ui-layer"
              style={{ zIndex: 1001 }}
            >
              ×
            </button>

            {/* Map title */}
            <div className="absolute top-4 left-4 text-white text-xl font-bold z-10 bg-black bg-opacity-50 px-4 py-2 rounded">
              Club Penguin Map
            </div>

            {/* SWF Map container */}
            <div 
              className="w-full h-full rounded-lg overflow-hidden relative"
              style={{ 
                background: '#1e3a8a' // Blue background fallback
              }}
            >
              {/* Loading indicator - hidden after 3 seconds */}
              {showLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-lg pointer-events-none" style={{ opacity: 0.9, zIndex: 10 }}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <div>Loading Club Penguin Map...</div>
                    <div className="text-sm text-blue-200 mt-2">Hover over map areas for animations</div>
                  </div>
                </div>
              )}
              
              {/* Multiple fallback approaches for SWF loading */}
              
              {/* Method 1: Direct Ruffle Player Custom Element */}
              <ruffle-player 
                src="/map.swf"
                autoplay="on"
                unmuteOverlay="hidden"
                letterbox="off"
                scale="noborder"
                backgroundColor="#ffffff"
                allowScriptAccess="always"
                wmode="direct"
                quality="high"
                menu="false"
                allowFullscreen="false"
                allowNetworking="all"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 3,
                  pointerEvents: 'auto'
                }}
              />
              
              {/* Method 2: Object tag fallback */}
              <object 
                data="/map.swf"
                type="application/x-shockwave-flash"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2,
                  pointerEvents: 'auto'
                }}
              >
                <param name="movie" value="/map.swf" />
                <param name="quality" value="high" />
                <param name="bgcolor" value="#ffffff" />
                <param name="allowScriptAccess" value="always" />
                <param name="allowFullScreen" value="false" />
                <param name="wmode" value="direct" />
                <param name="scale" value="noborder" />
                <param name="play" value="true" />
                <param name="loop" value="true" />
                <param name="menu" value="false" />
                
                {/* Method 3: Embed fallback */}
                <embed 
                  src="/map.swf"
                  type="application/x-shockwave-flash"
                  width="100%"
                  height="100%"
                  quality="high"
                  bgcolor="#ffffff"
                  allowScriptAccess="always"
                  allowFullScreen="false"
                  wmode="direct"
                  scale="noborder"
                  play="true"
                  loop="true"
                  menu="false"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    pointerEvents: 'auto'
                  }}
                />
              </object>
            </div>
          </div>
        </div>
      )}
    </>
  );
};