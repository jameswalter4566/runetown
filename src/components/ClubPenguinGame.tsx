import React, { useState, Suspense, useEffect, useMemo, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { PenguinModel } from './PenguinModel';
import { OptimizedBackground } from './OptimizedBackground';
import { RuffleBackground } from './RuffleBackground';
import PlayNowPopup from './PlayNowPopup';
import PenguinCreationForm from './PenguinCreationForm';
import LoginForm from './LoginForm';
import ProfilePopup from './ProfilePopup';
import TokenProfilePopup from './TokenProfilePopup';
import ExistingPenguinCard from './ExistingPenguinCard';
import { FixedAspectRatioWrapper } from './FixedAspectRatioWrapper';
import { MapInterface } from './MapInterface';
import { RealtimeTokenFeed } from './RealtimeTokenFeed';
import { MapMusic } from './MapMusic';
import { RuneScapeChat } from './RuneScapeChat';
// Use Socket.io for low-latency multiplayer, Supabase for auth/chat
import { useSocketMultiplayer } from '@/hooks/useSocketMultiplayer';
// import { useMultiplayerImproved } from '@/hooks/useMultiplayerImproved'; // Fallback to Supabase if needed
import { OtherPlayerOptimized } from './multiplayer/OtherPlayerOptimized';
import { PenguinModelOptimized } from './PenguinModelOptimized';
import { supabase } from '@/integrations/supabase/client';
import * as bcrypt from 'bcryptjs';
import { getModelFileFromHex } from '@/lib/penguinColors';
import { WORLD_BOUNDS } from '@/constants';

// Ground plane that handles clicks - MASSIVE to ensure no dead zones
function Ground({ onGroundClick }: { 
  onGroundClick: (point: THREE.Vector3) => void;
}) {
  const lastClickTime = useRef(0);
  
  const handleClick = (event: any) => {
    const now = Date.now();
    // Prevent duplicate clicks within 200ms for better debouncing
    if (now - lastClickTime.current < 200) return;
    lastClickTime.current = now;
    
    const point = event.point;
    event.stopPropagation();
    onGroundClick(new THREE.Vector3(point.x, 0, point.z));
  };
  
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      onClick={handleClick}
      onPointerDown={handleClick} // Also respond to pointer down for faster response
      renderOrder={1000} // Highest render order to catch all clicks
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial opacity={0} transparent depthWrite={false} />
    </mesh>
  );
}

type MapArea = 'town' | 'stadium' | 'plaza' | 'forest' | 'cove' | 'mineshack' | 'coffeeshop' | 'nightclub' | 'giftshop' | 'dock' | 'forts';

interface MapConfig {
  name: MapArea;
  backgroundImage: string;
  backgroundType?: 'image' | 'swf';
  displayName: string;
  boundaries: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

const MAPS: Record<MapArea, MapConfig> = {
  town: {
    name: 'town',
    backgroundImage: '/RoomsTown-November2015.swf',
    backgroundType: 'swf',
    displayName: 'Town Center',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  stadium: {
    name: 'stadium',
    backgroundImage: '/Stadium_April_2024.webp',
    displayName: 'Stadium',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  plaza: {
    name: 'plaza',
    backgroundImage: '/Plaza.webp',
    displayName: 'Plaza',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  dock: {
    name: 'dock',
    backgroundImage: '/dock.swf',
    backgroundType: 'swf',
    displayName: 'Dock',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  forts: {
    name: 'forts',
    backgroundImage: '/forts.swf',
    backgroundType: 'swf',
    displayName: 'Forts',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  forest: {
    name: 'forest',
    backgroundImage: '/Forest.webp',
    displayName: 'Forest',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  cove: {
    name: 'cove',
    backgroundImage: '/RoomsCove_4.swf',
    backgroundType: 'swf',
    displayName: 'Cove',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  mineshack: {
    name: 'mineshack',
    backgroundImage: '/Mine_Shack.webp',
    displayName: 'Mine Shack',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  coffeeshop: {
    name: 'coffeeshop',
    backgroundImage: '/RoomsCoffee1.swf',
    backgroundType: 'swf',
    displayName: 'Coffee Shop',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  nightclub: {
    name: 'nightclub',
    backgroundImage: '/RoomsDance_9.swf',
    backgroundType: 'swf',
    displayName: 'Night Club',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  },
  giftshop: {
    name: 'giftshop',
    backgroundImage: '/ArtworkRoomsShop40.swf',
    backgroundType: 'swf',
    displayName: 'Gift Shop',
    boundaries: { left: -7, right: 7, top: -7, bottom: 7 }
  }
};

// Door definitions - each door is a rectangle defined by min/max coordinates
interface Door {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  targetMap: MapArea;
  entryPoint: 'fromLeft' | 'fromRight' | 'fromTop' | 'fromBottom' | 'fromTopLeft' | 'fromTopRight' | 'fromBottomLeft' | 'fromBottomRight';
}

// Map access rules - which maps can be accessed from each location
const MAP_ACCESS_RULES: Record<MapArea, MapArea[]> = {
  town: ['coffeeshop', 'nightclub', 'giftshop', 'dock', 'forts'],
  coffeeshop: ['town'],
  nightclub: ['town'],
  giftshop: ['town'],
  dock: ['town'],
  forts: ['town'],
  stadium: [],
  plaza: [],
  forest: [],
  cove: [],
  mineshack: []
};

const DOORS_BY_MAP: Record<MapArea, Door[]> = {
  town: [
    // Coffee Shop door (left side)
    {
      minX: -4.05,
      maxX: -3.55,
      minZ: -0.78,
      maxZ: 0.54,
      targetMap: 'coffeeshop',
      entryPoint: 'fromBottom'
    },
    // Night Club door (center)
    {
      minX: 0.98,
      maxX: 1.03,
      minZ: -1.73,
      maxZ: -0.42,
      targetMap: 'nightclub',
      entryPoint: 'fromBottom'
    },
    // Gift Shop door (right side)
    {
      minX: 3.77,
      maxX: 4.52,
      minZ: -2.13,
      maxZ: -0.09,
      targetMap: 'giftshop',
      entryPoint: 'fromBottom'
    },
    // Invisible door to dock (left side)
    {
      minX: -6.67,
      maxX: -5.67,
      minZ: 1.38,
      maxZ: 2.38,
      targetMap: 'dock',
      entryPoint: 'fromRight'
    },
    // Invisible door to forts (right side)
    {
      minX: 5.96,
      maxX: 6.96,
      minZ: 1.55,
      maxZ: 2.55,
      targetMap: 'forts',
      entryPoint: 'fromLeft'
    }
  ],
  coffeeshop: [
    // Exit door back to town
    {
      minX: -1.0,
      maxX: 1.0,
      minZ: 5.5,
      maxZ: 6.5,
      targetMap: 'town',
      entryPoint: 'fromLeft'
    }
  ],
  nightclub: [
    // Exit door back to town
    {
      minX: -1.0,
      maxX: 1.0,
      minZ: 5.5,
      maxZ: 6.5,
      targetMap: 'town',
      entryPoint: 'fromBottom'
    }
  ],
  giftshop: [
    // Exit door back to town
    {
      minX: -1.0,
      maxX: 1.0,
      minZ: 5.5,
      maxZ: 6.5,
      targetMap: 'town',
      entryPoint: 'fromRight'
    }
  ],
  dock: [
    // Return door to town
    {
      minX: 5.96,
      maxX: 6.96,
      minZ: 1.55,
      maxZ: 2.55,
      targetMap: 'town',
      entryPoint: 'fromLeft'
    }
  ],
  forts: [
    // Door back to town at exactly (-4.88, 1.06)
    {
      minX: -5.13,
      maxX: -4.63,
      minZ: 0.81,
      maxZ: 1.31,
      targetMap: 'town',
      entryPoint: 'fromTop'
    }
  ],
  // Empty door arrays for maps without doors
  stadium: [],
  plaza: [],
  forest: [],
  cove: [],
  mineshack: []
};

export default function ClubPenguinGame() {
  const [currentMap, setCurrentMap] = useState<MapArea>('town'); // Always start in town
  const [penguinPosition, setPenguinPosition] = useState<[number, number, number]>([0, 0, 0]); // Center of town
  const [targetPosition, setTargetPosition] = useState<[number, number, number] | null>(null);
  const [penguinModel, setPenguinModel] = useState('wAddleCYAN.glb'); // Default penguin model
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [messages, setMessages] = useState<Array<{ 
    id: string; 
    text: string; 
    timestamp: number;
    penguinName: string;
    penguinColor: string;
    userId: string;
  }>>([]);
  const [showPlayNow, setShowPlayNow] = useState(true);
  const [showPenguinCreation, setShowPenguinCreation] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showExistingPenguin, setShowExistingPenguin] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [penguinColor, setPenguinColor] = useState<string>('#00BCD4'); // Default cyan
  const [penguinDirection, setPenguinDirection] = useState(0);
  const [isWaddling, setIsWaddling] = useState(false);
  const [waddlePhase, setWaddlePhase] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    username: string;
    modelFile: string;
    mintAddress?: string;
    marketCap?: number;
    holders?: number;
    coins: number;
    stamps: Array<any>;
  } | null>(null);
  const [userTokenData, setUserTokenData] = useState<{ mintAddress?: string | null; marketCap?: number | null; holders?: number | null }>({});

  // Check if user has a valid session
  useEffect(() => {
    const checkSession = async () => {
      const sessionUserId = localStorage.getItem('userId');
      const sessionUsername = localStorage.getItem('penguinName');
      const sessionModel = localStorage.getItem('penguinModel');
      const sessionColor = localStorage.getItem('penguinColor');
      const sessionToken = localStorage.getItem('sessionToken');
      
      console.log('=== SESSION DEBUG INFO ===');
      console.log('sessionUserId:', sessionUserId);
      console.log('sessionUsername:', sessionUsername);
      console.log('sessionModel:', sessionModel);
      console.log('sessionColor:', sessionColor);
      console.log('sessionToken:', sessionToken);
      
      if (sessionUserId && sessionUsername && sessionModel && sessionColor && sessionToken) {
        console.log('✓ All session data present in localStorage');
        
        // Verify the session is still valid
        try {
          const { data: user, error } = await supabase
            .from('users')
            .select('id, penguin_name, penguin_color, mint_address, market_cap')
            .eq('id', sessionUserId)
            .single();
          
          console.log('Database query result:', { user, error });
          
          if (user && !error) {
            console.log('✓ User found in database');
            console.log('Database penguin_color:', user.penguin_color);
            
            // Add # back to hex color if needed
            const hexColor = user.penguin_color.startsWith('#') ? user.penguin_color : '#' + user.penguin_color;
            console.log('Final hex color:', hexColor);
            
            const modelFile = getModelFileFromHex(hexColor);
            console.log('Model file from hex:', modelFile);
            
            // Set user data but don't sign in yet - show existing penguin card first
            setUserId(user.id);
            setUsername(user.penguin_name);
            setPenguinColor(hexColor); // Store the penguin color
            setPenguinModel(modelFile); // Convert hex to model
            
            // Store token data
            setUserTokenData({
              mintAddress: user.mint_address,
              marketCap: user.market_cap,
              holders: user.holders
            });
            
            console.log('✓ State updated, showing existing penguin card');
            // Show existing penguin card instead of directly signing in
            // setShowExistingPenguin(true); // Disabled - always show PlayNow
            return;
          } else {
            console.log('✗ User not found in database or error occurred');
          }
        } catch (error) {
          console.error('Session validation failed:', error);
        }
      } else {
        console.log('✗ Missing session data in localStorage');
        console.log('Missing:', {
          userId: !sessionUserId,
          username: !sessionUsername,
          model: !sessionModel,
          color: !sessionColor,
          token: !sessionToken
        });
      }
      
      // No valid session, show play now popup
      console.log('Clearing session and showing PlayNow popup');
      clearSession();
      // setShowPlayNow(true); // Already true by default
    };
    
    checkSession();
  }, []);

  // Set up real-time chat subscription
  useEffect(() => {
    if (!isSignedIn || !currentMap) return;

    // Subscribe to chat messages for current map
    const channel = supabase
      .channel(`chat:${currentMap}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `map_area=eq.${currentMap}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMessage.id,
            text: newMessage.message,
            timestamp: Date.now(),
            penguinName: newMessage.penguin_name,
            penguinColor: newMessage.penguin_color,
            userId: newMessage.user_id
          }]);
          
          // Auto-remove after 5 seconds
          setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSignedIn, currentMap]);
  
  const clearSession = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('penguinName');
    localStorage.removeItem('penguinModel');
    localStorage.removeItem('penguinColor');
    localStorage.removeItem('sessionToken');
    setIsSignedIn(false);
    setUserId(null);
    setUsername('');
    setPenguinColor('#00BCD4'); // Reset to default cyan
  };
  
  // Memoize initial position to prevent recreating multiplayer hook
  const initialPosition = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  
  const transitionToMap = useCallback((newMap: MapArea, entryPoint: 'fromLeft' | 'fromRight' | 'fromTop' | 'fromBottom' | 'fromTopLeft' | 'fromTopRight' | 'fromBottomLeft' | 'fromBottomRight') => {
    // Enforce map access rules
    const allowedMaps = MAP_ACCESS_RULES[currentMap] || [];
    if (!allowedMaps.includes(newMap)) {
      console.error(`Cannot transition from ${currentMap} to ${newMap} - not allowed!`);
      return;
    }
    
    setIsTransitioning(true);
    
    // Fade out effect
    setTimeout(() => {
      setCurrentMap(newMap);
      
      // Set penguin position based on entry point
      if (entryPoint === 'fromLeft') {
        setPenguinPosition([-6, 0, 0]);
      } else if (entryPoint === 'fromRight') {
        setPenguinPosition([6, 0, 0]);
      } else if (entryPoint === 'fromTop') {
        setPenguinPosition([0, 0, 6]);
      } else if (entryPoint === 'fromBottom') {
        setPenguinPosition([0, 0, -6]);
      } else if (entryPoint === 'fromTopLeft') {
        setPenguinPosition([-5, 0, 5]);
      } else if (entryPoint === 'fromTopRight') {
        setPenguinPosition([5, 0, 5]);
      } else if (entryPoint === 'fromBottomLeft') {
        setPenguinPosition([-5, 0, -5]);
      } else if (entryPoint === 'fromBottomRight') {
        setPenguinPosition([5, 0, -5]);
      }
      
      setTargetPosition(null);
      
      // Fade in effect
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 300);
  }, [currentMap]);
  
  // Initialize Socket.io multiplayer for low latency
  const { 
    processMovementInput, 
    getLocalPlayerPosition, 
    getOtherPlayers,
    isConnected,
    latency,
    playerCount
  } = useSocketMultiplayer({
    username,
    modelFile: penguinModel,
    currentMap,
    isSignedIn,
    initialPosition,
    userId
  });
  
  // Update local player position from physics engine
  useEffect(() => {
    if (isSignedIn && isConnected) {
      const animationFrame = () => {
        const pos = getLocalPlayerPosition();
        setPenguinPosition([pos.x, pos.y, pos.z]);
        
        // Check for door collisions - ONLY for the current map
        if (!isTransitioning && DOORS_BY_MAP[currentMap]) {
          const currentMapDoors = DOORS_BY_MAP[currentMap];
          
          // Debug log to verify we're checking the right doors
          if (currentMapDoors.length > 0) {
            for (const door of currentMapDoors) {
              if (pos.x >= door.minX && pos.x <= door.maxX && 
                  pos.z >= door.minZ && pos.z <= door.maxZ) {
                // Player is in a door zone, transition to the new map
                console.log(`Door collision detected on ${currentMap} map, transitioning to ${door.targetMap}`);
                transitionToMap(door.targetMap, door.entryPoint);
                break;
              }
            }
          }
        }
        
        // Check if we've reached the target
        if (targetPosition !== null) {
          const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);
          const target = new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2]);
          const distance = currentPos.distanceTo(target);
          
          // If we're close enough to the target, stop moving
          if (distance < 0.15) { // Match the physics engine threshold
            setTargetPosition(null);
            setIsWaddling(false);
            // Don't call processMovementInput(null) - let physics engine handle stopping
            // Keep the current direction - don't change it when stopping
          } else {
            // Still moving
            setIsWaddling(true);
            setWaddlePhase(Date.now() * 0.008);
            
            // Calculate direction based on movement
            const direction = Math.atan2(target.x - currentPos.x, target.z - currentPos.z);
            setPenguinDirection(direction);
          }
        } else {
          // No target, ensure we're not waddling
          setIsWaddling(false);
        }
        
        requestAnimationFrame(animationFrame);
      };
      const frameId = requestAnimationFrame(animationFrame);
      return () => cancelAnimationFrame(frameId);
    }
  }, [isSignedIn, isConnected, getLocalPlayerPosition, targetPosition, processMovementInput, currentMap, isTransitioning, transitionToMap]);
  
  // DISABLED - No automatic transitions to prevent movement blocking
  // Map transitions will only work through door clicks
  
  const handleGroundClick = (point: THREE.Vector3) => {
    if (isSignedIn) {
      // Use imported world bounds
      
      // Clamp to world bounds BEFORE issuing movement
      const boundedX = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, point.x));
      const boundedZ = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, point.z));
      
      processMovementInput({ x: boundedX, y: 0, z: boundedZ });
      setTargetPosition([boundedX, 0, boundedZ]);
    }
  };
  
  const handlePenguinClick = () => {
    if (isSignedIn) {
      setSelectedPlayer(null); // Clear selected player to show local player's profile
      setShowProfile(true);
    }
  };

  const handleClosePlayNow = () => {
    // Can't close without signing in
    return;
  };

  const handleLogin = () => {
    setShowPlayNow(false);
    setShowLogin(true);
  };
  
  const handleLoginSuccess = async (data: { id: string; name: string; modelFile: string }) => {
    // Create a session token
    const sessionToken = `${data.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('=== LOGIN SUCCESS DEBUG ===');
    console.log('Login data:', data);
    
    // Get penguin data from database
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('penguin_color, mint_address, market_cap')
        .eq('id', data.id)
        .single();
      
      console.log('Database penguin_color query result:', { user, error });
      
      if (user && !error) {
        const hexColor = user.penguin_color.startsWith('#') ? user.penguin_color : '#' + user.penguin_color;
        console.log('Final hex color to save:', hexColor);
        
        // Store token data
        setUserTokenData({
          mintAddress: user.mint_address,
          marketCap: user.market_cap,
          holders: user.holders
        });
        
        // Save session data including penguin color
        localStorage.setItem('userId', data.id);
        localStorage.setItem('penguinName', data.name);
        localStorage.setItem('penguinModel', data.modelFile);
        localStorage.setItem('penguinColor', hexColor);
        localStorage.setItem('sessionToken', sessionToken);
        
        console.log('✓ Session data saved to localStorage');
        console.log('Saved values:');
        console.log('  userId:', data.id);
        console.log('  penguinName:', data.name);
        console.log('  penguinModel:', data.modelFile);
        console.log('  penguinColor:', hexColor);
        console.log('  sessionToken:', sessionToken);
        
        // Update state
        setUserId(data.id);
        setUsername(data.name);
        setPenguinModel(data.modelFile);
        setPenguinColor(hexColor);
        setIsSignedIn(true);
        setShowLogin(false);
        
        // Ensure we start in town map at center position
        setCurrentMap('town');
        setPenguinPosition([0, 0, 0]);
        setTargetPosition(null);
      }
    } catch (error) {
      console.error('Failed to get penguin color:', error);
    }
  };
  
  const handleLoginBack = () => {
    setShowLogin(false);
    setShowPlayNow(true);
  };
  
  const handleLogout = () => {
    clearSession();
    setShowPlayNow(true);
  };

  const handleExistingPenguinPlay = () => {
    // User clicked the penguin card to play
    console.log('=== EXISTING PENGUIN PLAY DEBUG ===');
    console.log('Setting isSignedIn to true');
    console.log('Current state:', {
      isSignedIn,
      username,
      penguinColor,
      penguinModel,
      userId
    });
    
    setIsSignedIn(true);
    setShowExistingPenguin(false);
    
    // Always start in town map at center
    setCurrentMap('town');
    setPenguinPosition([0, 0, 0]);
    setTargetPosition(null);
    
    console.log('✓ State updates triggered');
  };

  const handleExistingPenguinLoginDifferent = () => {
    // User wants to login as a different penguin - show login page
    clearSession();
    setShowExistingPenguin(false);
    setShowLogin(true);
  };

  const handleCreatePenguin = () => {
    setShowPlayNow(false);
    setShowPenguinCreation(true);
  };

  const handlePenguinCreationComplete = async (data: {
    name: string;
    color: string;
    modelFile: string;
    password: string;
  }) => {
    console.log('=== PENGUIN CREATION COMPLETE DEBUG ===');
    console.log('Creation data:', data);
    
    // After creation, automatically log them in
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('penguin_name', data.name)
        .single();
      
      console.log('User lookup after creation:', { user, error });
      
      if (user && !error) {
        // Store the penguin color in localStorage for session persistence
        localStorage.setItem('penguinColor', data.color);
        console.log('✓ Penguin color stored in localStorage:', data.color);
        
        handleLoginSuccess({
          id: user.id,
          name: data.name,
          modelFile: data.modelFile
        });
        setPenguinColor(data.color); // Store the penguin color from creation
        setShowPenguinCreation(false);
        
        // Ensure spawn in town after creation
        setCurrentMap('town');
        setPenguinPosition([0, 0, 0]);
        setTargetPosition(null);
      }
    } catch (error) {
      console.error('Auto-login after creation failed:', error);
    }
  };

  const handlePenguinCreationBack = () => {
    setShowPenguinCreation(false);
    setShowPlayNow(true);
  };
  
  

  // Simple debug overlay toggle
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  
  
  // Enable debug overlay with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        setShowDebugOverlay(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  // Memoize door click handler to prevent Ruffle from reloading
  const handleDoorClick = useCallback((doorId: string) => {
    console.log('Door clicked:', doorId);
    // Simple door mapping based on current map and door ID
    if (currentMap === 'town') {
      if (doorId === 'coffee' || doorId === 'coffee_door') {
        transitionToMap('coffeeshop', 'fromRight');
      } else if (doorId === 'dance' || doorId === 'night_club') {
        transitionToMap('nightclub', 'fromRight');
      } else if (doorId === 'gift' || doorId === 'gift_shop') {
        transitionToMap('giftshop', 'fromRight');
      }
    } else if (currentMap === 'coffeeshop' && doorId === 'exit') {
      transitionToMap('town', 'fromLeft');
    } else if (currentMap === 'nightclub' && doorId === 'exit') {
      transitionToMap('town', 'fromBottom');
    } else if (currentMap === 'giftshop' && doorId === 'exit') {
      transitionToMap('town', 'fromRight');
    }
  }, [currentMap, transitionToMap]);
  

  return (
    <>
      {/* Token Feed - Always visible */}
      <RealtimeTokenFeed />
      
      {/* Map Music - Only when signed in */}
      {/* Disabled game music
      {isSignedIn && (
        <MapMusic currentMap={currentMap} volume={0.3} />
      )}
      */}
      
      <FixedAspectRatioWrapper>
        <div 
          className="relative w-full h-full overflow-hidden"
        >
        {/* Background Map - either SWF or Image */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          zIndex: 1, // Behind 3D canvas but visible
          width: '100%',
          height: '100%'
        }}>
          {MAPS[currentMap].backgroundType === 'swf' ? (
            <RuffleBackground 
              swfPath={MAPS[currentMap].backgroundImage} 
              onDoorClick={handleDoorClick}
            />
          ) : (
            <OptimizedBackground imageSrc={MAPS[currentMap].backgroundImage} />
          )}
        </div>
        
        {/* SWF Analyzer for debugging door structures - commented out */}
        {/* {currentMap === 'town' && MAPS[currentMap].backgroundType === 'swf' && (
          <SwfAnalyzer swfPath={MAPS[currentMap].backgroundImage} />
        )} */}
      
      {/* Debug overlay (Ctrl+D to toggle) */}
      {showDebugOverlay && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded">
            <div className="text-sm font-bold mb-2">Debug Mode (Ctrl+D to toggle)</div>
            <div className="text-xs space-y-1">
              <div>Current map: {currentMap}</div>
              <div>Penguin Position: x={penguinPosition[0].toFixed(2)}, z={penguinPosition[2].toFixed(2)}</div>
              <div className="mt-2 font-bold">Layer Stack (bottom to top):</div>
              <div className="text-gray-300">1. Background (z=0): {MAPS[currentMap].backgroundImage}</div>
              <div className="text-gray-300">2. Barrier Layer (z=1)</div>
              <div className="text-gray-300">3. 3D Canvas (z=10)</div>
              <div className="text-gray-300">4. UI Elements (z=20+)</div>
              <div className="mt-2 text-yellow-300">Check console for Ruffle debug logs</div>
              <div className="text-green-300">Right-click SWF for Ruffle debug menu</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Play Now Popup */}
      {showPlayNow && (
        <PlayNowPopup
          onClose={handleClosePlayNow}
          onLogin={handleLogin}
          onCreatePenguin={handleCreatePenguin}
        />
      )}
      
      {/* Penguin Creation Form */}
      {showPenguinCreation && (
        <PenguinCreationForm
          onBack={handlePenguinCreationBack}
          onComplete={handlePenguinCreationComplete}
        />
      )}
      
      {/* Login Form */}
      {showLogin && (
        <LoginForm
          onBack={handleLoginBack}
          onSuccess={handleLoginSuccess}
        />
      )}
      
      {/* Existing Penguin Card */}
      {showExistingPenguin && (
        <ExistingPenguinCard
          username={username}
          penguinColor={penguinColor}
          onLoginDifferent={handleExistingPenguinLoginDifferent}
          onPlay={handleExistingPenguinPlay}
        />
      )}
      
      {/* Let Ruffle handle door animations natively */}
      
      {/* Transition overlay */}
      {isTransitioning && (
        <div 
          className="absolute inset-0 bg-black transition-opacity duration-300 z-10"
          style={{ opacity: isTransitioning ? 1 : 0 }}
        />
      )}
      

      {/* 3D Canvas with Penguin - Only render if signed in */}
      {isSignedIn && false && (
      <Canvas 
        className="absolute inset-0" 
        style={{ 
          pointerEvents: 'auto',
          zIndex: 100, // Highest priority for clicks
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        shadows
        gl={{ 
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true
        }}
        camera={{ position: [0, 8, 8], fov: 45 }}
      >
        <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={45} />
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          minDistance={8}
          maxDistance={20}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 3.5}
          target={[0, 0, 0]}
        />
        
        
        <Suspense fallback={null}>
          {isConnected && (
            <PenguinModelOptimized 
              position={getLocalPlayerPosition()}
              direction={penguinDirection}
              isMoving={targetPosition !== null}
              modelFile={penguinModel}
              messages={messages.filter(msg => msg.userId === userId)}
              onClick={handlePenguinClick}
              username={username}
              marketCap={userTokenData.marketCap || 4200}
            />
          )}
          
          {/* Render other players */}
          {getOtherPlayers().map((player) => (
            <OtherPlayerOptimized
              key={player.id}
                position={player.position}
                direction={player.direction || 0}
                isMoving={player.isMoving || false}
                isWaddling={player.isWaddling || player.isMoving || false}
                waddlePhase={player.waddlePhase || 0}
                modelFile={player.modelFile || 'wAddleCYAN.glb'}
                username={player.username || 'Unknown'}
                lastUpdate={Date.now()}
                marketCap={4200}
                messages={messages.filter(msg => msg.userId === player.userId)}
                onClick={async () => {
                  // Show profile popup for other players
                  // First, try to fetch the player's mint address from the database
                  let playerMintAddress = undefined;
                  let playerMarketCap = 4200;
                  let playerHolders = undefined;
                  
                  try {
                    const { data: userData, error } = await supabase
                      .from('users')
                      .select('mint_address, market_cap, holders')
                      .eq('penguin_name', player.username)
                      .single();
                      
                    if (userData && !error) {
                      playerMintAddress = userData.mint_address;
                      playerMarketCap = userData.market_cap || 4200;
                      playerHolders = userData.holders;
                    }
                  } catch (err) {
                    console.error('Failed to fetch player data:', err);
                  }
                  
                  setSelectedPlayer({
                    username: player.username,
                    modelFile: player.modelFile,
                    mintAddress: playerMintAddress,
                    marketCap: playerMarketCap,
                    holders: playerHolders,
                    coins: 0, // You can add coins tracking later
                    stamps: [] // You can add stamps tracking later
                  });
                  setShowProfile(true);
                }}
              />
          ))}
          
          <Ground onGroundClick={handleGroundClick} />
          
          {/* Removed emergency ground plane - redundant with main Ground component */}
        </Suspense>
      </Canvas>
      )}
      
      {/* Blue border around the map */}
      <div className="absolute inset-0 pointer-events-none border-8 border-blue-500" style={{ zIndex: 5 }} />
      
      {/* Connection Status */}
      {/* Disabled connection status
      {isSignedIn && (
        <div className="absolute top-20 right-4 bg-black/70 text-white p-2 rounded-lg text-sm ui-layer" style={{ zIndex: 200 }}>
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
          {isConnected && (
            <>
              <div style={{ color: 'white' }}>Latency: {latency}ms</div>
              <div style={{ color: 'white' }}>Players: {playerCount}</div>
            </>
          )}
        </div>
      )}
      */}
      
      {/* Map Interface - Now inside game viewport */}
      {/* Disabled map interface
      {isSignedIn && (
        <MapInterface 
          currentMap={currentMap}
          onMapSelect={(mapName, entryPoint) => {
            // Only allow map teleportation from town
            if (currentMap === 'town') {
              transitionToMap(mapName, entryPoint);
            } else {
              console.log('Map teleportation only allowed from town!');
            }
          }}
        />
      )}
      */}
      
      
      {/* Profile Popup - Moved outside of game viewport to ensure proper z-index */}
      {showProfile && (
        <div style={{ position: 'fixed', zIndex: 9999 }}>
          <TokenProfilePopup
            username={selectedPlayer?.username || username}
            modelFile={selectedPlayer?.modelFile || penguinModel}
            mintAddress={selectedPlayer?.mintAddress || userTokenData.mintAddress}
            marketCap={selectedPlayer?.marketCap || userTokenData.marketCap || 4200}
            onClose={() => {
              setShowProfile(false);
              setSelectedPlayer(null);
            }}
            coins={selectedPlayer?.coins || 500}
            stamps={selectedPlayer?.stamps || []}
            holders={selectedPlayer?.holders || userTokenData.holders}
          />
        </div>
      )}
      
      </div>
    </FixedAspectRatioWrapper>
    
    {/* RuneScape Chat Interface - Only show if signed in */}
    {isSignedIn && (
      <RuneScapeChat
        userId={userId}
        username={username}
        penguinColor={penguinColor}
        currentMap={currentMap}
        messages={messages}
        onSendMessage={async (text, channel) => {
          if (text.trim() && userId) {
            // Send message to database
            const { error } = await supabase
              .from('chat_messages')
              .insert({
                user_id: userId,
                penguin_name: username,
                penguin_color: penguinColor.substring(1), // Remove # from hex
                message: text,
                map_area: currentMap
              });
            
            if (error) {
              console.error('Failed to send message:', error);
            }
          }
        }}
      />
    )}
    </>
  );
}