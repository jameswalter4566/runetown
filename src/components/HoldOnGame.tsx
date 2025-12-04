import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MemeHanger } from './characters/MemeHanger';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '../integrations/supabase/client';
import { applyHangerPose } from '../animation/applyHangerPose';
import { myPlayerIdRef } from '../PlayerContext';
import { useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  screenName: string;
  wallet: string;
  privateKey?: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isHolding: boolean;
  isFalling: boolean;
  character: MemeHanger;
  fallStart?: number;
}


// Realistic Bridge component
const Bridge = () => {
  return (
    <group>
      {/* Main bridge deck - extended to screen edges */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[120, 0.8, 4]} />
        <meshStandardMaterial 
          color="#2C2C2C" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Bridge deck concrete texture */}
      <mesh position={[0, 0.41, 0]} receiveShadow>
        <boxGeometry args={[120, 0.02, 4]} />
        <meshStandardMaterial 
          color="#4A4A4A" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Side barriers */}
      <mesh position={[0, 0.8, 2.2]} castShadow>
        <boxGeometry args={[120, 1.2, 0.2]} />
        <meshStandardMaterial color="#E5E5E5" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.8, -2.2]} castShadow>
        <boxGeometry args={[120, 1.2, 0.2]} />
        <meshStandardMaterial color="#E5E5E5" roughness={0.3} />
      </mesh>
      
      {/* Main suspension towers */}
      <mesh position={[-25, 15, 0]} castShadow>
        <boxGeometry args={[1.5, 30, 1.5]} />
        <meshStandardMaterial color="#B0B0B0" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[25, 15, 0]} castShadow>
        <boxGeometry args={[1.5, 30, 1.5]} />
        <meshStandardMaterial color="#B0B0B0" metalness={0.7} roughness={0.2} />
      </mesh>
      
      {/* Tower cross beams */}
      <mesh position={[-25, 25, 0]} castShadow>
        <boxGeometry args={[3, 0.5, 0.5]} />
        <meshStandardMaterial color="#909090" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[25, 25, 0]} castShadow>
        <boxGeometry args={[3, 0.5, 0.5]} />
        <meshStandardMaterial color="#909090" metalness={0.8} roughness={0.1} />
      </mesh>
      
      {/* Main suspension cables */}
      <mesh position={[-25, 15, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 30]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[25, 15, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 30]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Suspension cables connecting towers */}
      <mesh position={[0, 30, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 50]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Vertical suspension cables - properly connected */}
      {Array.from({ length: 24 }, (_, i) => {
        const x = -30 + (i * 2.5);
        const bridgeHeight = 0.8; // Bridge deck height
        const cableTopHeight = 30 - (Math.abs(x) * 0.15); // Cable curve
        const cableLength = cableTopHeight - bridgeHeight;
        const cableY = bridgeHeight + (cableLength / 2);
        
        // Only show cables within reasonable range
        if (Math.abs(x) <= 25) {
          return (
            <mesh key={i} position={[x, cableY, 0]} castShadow>
              <cylinderGeometry args={[0.015, 0.015, cableLength]} />
              <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
            </mesh>
          );
        }
        return null;
      })}
      
      {/* Bridge foundation pillars */}
      <mesh position={[-25, -25, 0]} castShadow>
        <cylinderGeometry args={[3, 2, 50]} />
        <meshStandardMaterial color="#6A6A6A" roughness={0.8} />
      </mesh>
      <mesh position={[25, -25, 0]} castShadow>
        <cylinderGeometry args={[3, 2, 50]} />
        <meshStandardMaterial color="#6A6A6A" roughness={0.8} />
      </mesh>
      
      {/* Expansion joints */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[(-25 + (i * 4.2)), 0.5, 0]}>
          <boxGeometry args={[0.1, 0.3, 4]} />
          <meshStandardMaterial color="#1A1A1A" metalness={0.9} />
        </mesh>
      ))}
      
    </group>
  );
};


// Hyper-realistic Car component
const RealisticCar: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => {
  return (
    <group position={position}>
      {/* Main car body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4.2, 1.4, 1.8]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>
      
      {/* Car roof */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2.8, 0.8, 1.6]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>
      
      {/* Front windshield */}
      <mesh position={[1.4, 0.9, 0]} castShadow>
        <boxGeometry args={[0.05, 1.0, 1.5]} />
        <meshStandardMaterial 
          color="#87CEEB" 
          metalness={0.1} 
          roughness={0.0}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Rear windshield */}
      <mesh position={[-1.4, 0.9, 0]} castShadow>
        <boxGeometry args={[0.05, 1.0, 1.5]} />
        <meshStandardMaterial 
          color="#87CEEB" 
          metalness={0.1} 
          roughness={0.0}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Side windows */}
      <mesh position={[0, 1.1, 0.85]} castShadow>
        <boxGeometry args={[2.6, 0.6, 0.05]} />
        <meshStandardMaterial 
          color="#87CEEB" 
          metalness={0.1} 
          roughness={0.0}
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh position={[0, 1.1, -0.85]} castShadow>
        <boxGeometry args={[2.6, 0.6, 0.05]} />
        <meshStandardMaterial 
          color="#87CEEB" 
          metalness={0.1} 
          roughness={0.0}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Headlights */}
      <mesh position={[2.15, 0.2, 0.6]} castShadow>
        <sphereGeometry args={[0.25]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFAA"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[2.15, 0.2, -0.6]} castShadow>
        <sphereGeometry args={[0.25]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFAA"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Taillights */}
      <mesh position={[-2.15, 0.2, 0.6]} castShadow>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[-2.15, 0.2, -0.6]} castShadow>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Wheels with rims */}
      {[
        [1.5, -0.7, 1.0],
        [1.5, -0.7, -1.0],
        [-1.5, -0.7, 1.0],
        [-1.5, -0.7, -1.0]
      ].map((wheelPos, index) => (
        <group key={index} position={wheelPos as [number, number, number]}>
          {/* Tire */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.4, 0.15, 8, 16]} />
            <meshStandardMaterial color="#1A1A1A" roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.1]} />
            <meshStandardMaterial 
              color="#C0C0C0" 
              metalness={0.9} 
              roughness={0.1}
            />
          </mesh>
          {/* Rim spokes */}
          {Array.from({ length: 5 }, (_, spokeIndex) => (
            <mesh 
              key={spokeIndex}
              position={[0, 0, 0]}
              rotation={[Math.PI / 2, 0, (spokeIndex * Math.PI * 2) / 5]}
            >
              <boxGeometry args={[0.4, 0.02, 0.12]} />
              <meshStandardMaterial 
                color="#808080" 
                metalness={0.8} 
                roughness={0.2}
              />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Door handles */}
      <mesh position={[0.5, 0.3, 0.92]} castShadow>
        <boxGeometry args={[0.3, 0.05, 0.05]} />
        <meshStandardMaterial color="#404040" metalness={0.9} />
      </mesh>
      <mesh position={[0.5, 0.3, -0.92]} castShadow>
        <boxGeometry args={[0.3, 0.05, 0.05]} />
        <meshStandardMaterial color="#404040" metalness={0.9} />
      </mesh>
      
      {/* Side mirrors */}
      <mesh position={[1.2, 0.8, 1.0]} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.05]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[1.2, 0.8, -1.0]} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.05]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* License plates */}
      <mesh position={[2.12, -0.2, 0]} castShadow>
        <boxGeometry args={[0.02, 0.2, 0.6]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-2.12, -0.2, 0]} castShadow>
        <boxGeometry args={[0.02, 0.2, 0.6]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SlowFreeway – v3  (full-width spawn + higher density)
// ─────────────────────────────────────────────────────────────────────────────
const SlowFreeway: React.FC = () => {
  const carsRef   = useRef<THREE.Group[]>([]);
  const speedsRef = useRef<number[]>([]);

  const ROAD_LEN   = 330;                   // matches road mesh length
  const HALF_ROAD  = ROAD_LEN / 2;          // 165
  const CAR_COUNT  = 40;                    // doubled traffic

  const carColors = [
    '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF',
    '#00FFFF', '#FFFFFF', '#000000', '#FFA500', '#800080',
    '#C0C0C0', '#8B4513', '#006400', '#FF69B4', '#4169E1'
  ];

  // ── animation ──
  useFrame((_, delta) => {
    carsRef.current.forEach((car, idx) => {
      if (!car) return;
      car.position.x += speedsRef.current[idx] * delta;
      if (car.position.x > HALF_ROAD + 5) {         // 5-unit buffer off-screen
        car.position.x = -HALF_ROAD - 5;
      }
    });
  });

  // ── scene ──
  return (
    <group position={[0, -35, 0]}>
      {/* Road surface */}
      <mesh receiveShadow>
        <boxGeometry args={[330, 0.3, 30]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.8} />
      </mesh>

      {/* Road shoulder */}
      <mesh position={[0, 0.02, 16]} receiveShadow>
        <boxGeometry args={[330, 0.1, 2]} />
        <meshStandardMaterial color="#404040" />
      </mesh>
      <mesh position={[0, 0.02, -16]} receiveShadow>
        <boxGeometry args={[330, 0.1, 2]} />
        <meshStandardMaterial color="#404040" />
      </mesh>
      
      {/* Lane divider lines */}
      {Array.from({ length: 5 }, (_, laneIndex) => {
        const zPos = (laneIndex - 2) * 4;
        return Array.from({ length: 66 }, (_, lineIndex) => (
          <mesh 
            key={`${laneIndex}-${lineIndex}`} 
            position={[(-160 + (lineIndex * 5)), 0.18, zPos]}
            receiveShadow
          >
            <boxGeometry args={[2, 0.02, 0.2]} />
            <meshStandardMaterial 
              color={laneIndex === 0 || laneIndex === 4 ? "#FFFFFF" : "#FFFF00"}
              emissive={laneIndex === 0 || laneIndex === 4 ? "#FFFFFF" : "#FFFF00"}
              emissiveIntensity={0.1}
            />
          </mesh>
        ));
      })}
      
      {/* Street lights */}
      {Array.from({ length: 17 }, (_, i) => (
        <group key={i} position={[(-80 + (i * 10)), 8, 18]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.15, 16]} />
            <meshStandardMaterial color="#505050" metalness={0.7} />
          </mesh>
          <mesh position={[0, 8.5, -2]}>
            <boxGeometry args={[1, 0.5, 2]} />
            <meshStandardMaterial 
              color="#FFFFAA" 
              emissive="#FFFF88" 
              emissiveIntensity={0.3}
            />
          </mesh>
          <pointLight
            position={[0, 8.5, -2]}
            intensity={2}
            distance={20}
            color="#FFFFAA"
            castShadow
          />
        </group>
      ))}

      {/* dynamic traffic */}
      {Array.from({ length: CAR_COUNT }, (_, i) => {
        // one-time speed assignment
        if (!speedsRef.current[i]) {
          speedsRef.current[i] = 18 + Math.random() * 10;   // 18-28 u/s
        }

        // initial spread across entire road
        const initialX = -HALF_ROAD + Math.random() * ROAD_LEN;
        const lane     = i % 6;                             // lanes 0-5
        const zLane    = (lane - 2.5) * 3.5;                // centre lanes

        return (
          <group
            key={i}
            ref={el => { if (el) carsRef.current[i] = el; }}
            position={[initialX, 0.7, zLane]}
          >
            <RealisticCar
              position={[0, 0, 0]}
              color={carColors[i % carColors.length]}
            />
          </group>
        );
      })}
      
      {/* Guard rails */}
      <mesh position={[0, 1, 17]} castShadow>
        <boxGeometry args={[330, 1.5, 0.2]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} />
      </mesh>
      <mesh position={[0, 1, -17]} castShadow>
        <boxGeometry args={[330, 1.5, 0.2]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} />
      </mesh>
    </group>
  );
};

// Player spawn dialog
interface SpawnDialogProps {
  isOpen: boolean;
  onSpawn: (screenName: string, wallet: string, privateKey: string) => void;
  onClose: () => void;
}

const SpawnDialog: React.FC<SpawnDialogProps> = ({ isOpen, onSpawn, onClose }) => {
  const [screenName, setScreenName] = useState('');
  const [wallet, setWallet] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const generateWallet = async () => {
    if (!screenName.trim()) {
      alert('Please enter a screen name first');
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-wallet', {
        body: {
          tokenName: screenName.trim()
        }
      });
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      if (error) {
        console.error('Error generating wallet:', error);
        alert('Failed to generate wallet. Please try again.');
        return;
      }
      
      if (data?.success) {
        setWallet(data.publicKey);
        setPrivateKey(data.encryptedPrivateKey);
        setShowWalletDetails(true);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error:', error);
      alert('Failed to generate wallet. Please try again.');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);
    }
  };

  const handleSpawn = () => {
    if (screenName.trim() && wallet && privateKey) {
      onSpawn(screenName.trim(), wallet, privateKey);
      // Reset all state
      setScreenName('');
      setWallet('');
      setPrivateKey('');
      setShowWalletDetails(false);
      setSliderValue(0);
      setShowPrivateKey(false);
      setHasSavedKey(false);
      setGenerationProgress(0);
      setIsDragging(false);
    }
  };

  const handleSliderStart = (clientX: number) => {
    setIsDragging(true);
  };

  const handleSliderMove = (clientX: number) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100);
    setSliderValue(percentage);
    
    if (percentage >= 95) {
      setShowPrivateKey(true);
      setIsDragging(false);
    }
  };

  const handleSliderEnd = () => {
    if (sliderValue < 95) {
      setSliderValue(0);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleSliderMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleSliderMove(e.touches[0].clientX);
    const handleMouseUp = () => handleSliderEnd();
    const handleTouchEnd = () => handleSliderEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, sliderValue]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-blue-900 to-blue-600 text-white border-2 border-blue-400">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-blue-300 comic-font animated-text">
            {showWalletDetails ? 'Here is your wallet!' : 'Join the Game'}
          </DialogTitle>
          {!showWalletDetails && (
            <div className="text-sm text-blue-200 space-y-2">
              <p className="font-semibold bubble-font">How the game works:</p>
              <ul className="text-xs space-y-1 list-disc list-inside bubble-font">
                <li>Hold SPACEBAR to stay on the bridge</li>
                <li>Prize pool grows by 0.02 SOL each time someone falls</li>
                <li>Last player holding wins the entire jackpot</li>
                <li>Your wallet will receive all winnings automatically</li>
              </ul>
              <p className="text-blue-400 font-semibold text-xs mt-2 comic-font wobble-text">
                SAVE YOUR PRIVATE KEY - We cannot recover lost keys!
              </p>
            </div>
          )}
          {showWalletDetails && (
            <div className="text-center">
              <p className="text-sm text-blue-200">Welcome, {screenName}!</p>
              <p className="text-sm text-blue-200 mt-2">
                Supply will be distributed here for the duration you hold on in game!
              </p>
              <p className="text-sm text-red-300 font-bold">
                Hold till the end to win the grand prize!
              </p>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {!showWalletDetails ? (
            // Initial wallet generation phase
            <>
              <div>
                <Label htmlFor="screenName" className="text-blue-300">Screen Name</Label>
                <Input
                  id="screenName"
                  placeholder="Enter your screen name"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value.slice(0, 20))}
                  maxLength={20}
                  className="bg-black/30 text-white border-blue-500"
                />
                <p className="text-xs text-blue-200">
                  {screenName.length}/20 characters
                </p>
              </div>
              
              <div>
                <Label className="text-blue-300">Solana Wallet</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={wallet || 'Wallet address will appear here...'}
                      readOnly
                      placeholder="Click generate to create wallet"
                      className="flex-1 text-xs bg-black/30 text-white border-blue-500"
                    />
                    <Button 
                      onClick={generateWallet} 
                      variant="outline"
                      disabled={isGenerating || !screenName.trim()}
                      className="min-w-[140px] bg-blue-700 text-white border-blue-500 hover:bg-blue-600"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Wallet'}
                    </Button>
                  </div>
                  
                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={generationProgress} className="w-full h-2" />
                      <p className="text-xs text-center text-blue-200">
                        Creating your Solana wallet... {generationProgress}%
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-black/30 p-4 rounded text-sm border border-blue-500 min-h-[120px]">
                    <p className="font-semibold mb-2 text-blue-300">Private Key:</p>
                    <div className="bg-black/50 p-3 rounded border border-blue-400 min-h-[80px] break-all font-mono text-xs text-blue-200">
                      {privateKey || 'Private key will be shown after generation...'}
                    </div>
                  </div>
                  
                  {!screenName.trim() && (
                    <p className="text-xs text-red-400">Enter screen name first</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Wallet details and private key reveal phase
            <>
              <div>
                <Label className="text-blue-300 font-semibold">Wallet Address:</Label>
                <div className="bg-black/50 p-3 rounded-lg mt-1 break-all text-xs font-mono border border-blue-500 text-blue-200">
                  {wallet}
                </div>
              </div>
              
              <div>
                <Label className="text-blue-300 font-semibold">Private Key:</Label>
                <div className="bg-black/50 p-3 rounded-lg mt-1 relative border border-blue-500">
                  {showPrivateKey ? (
                    <div className="break-all text-xs font-mono text-blue-300 bg-blue-900/30 p-2 rounded border">
                      {privateKey}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm mb-4 text-blue-300">Slide all the way to the end to unlock private key</p>
                      <div 
                        ref={sliderRef}
                        className="relative w-full h-14 bg-gray-800 rounded-full overflow-hidden cursor-pointer border-2 border-gray-600"
                      >
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-200 ease-out"
                          style={{ width: `${sliderValue}%` }}
                        />
                        <div 
                          className="absolute top-1 left-1 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing transform transition-all duration-200 ease-out hover:scale-110 z-10"
                          style={{ 
                            transform: `translateX(${(sliderValue / 100) * (sliderRef.current?.offsetWidth - 56 || 0)}px)`,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                          }}
                          onMouseDown={(e) => handleSliderStart(e.clientX)}
                          onTouchStart={(e) => handleSliderStart(e.touches[0].clientX)}
                        >
                          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white pointer-events-none drop-shadow-lg">
                          {sliderValue >= 95 ? 'UNLOCKED!' : 'Slide to reveal private key'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {showPrivateKey && (
                <div className="space-y-4">
                  <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500">
                    <p className="text-blue-300 text-sm font-semibold mb-2">IMPORTANT - SAVE YOUR KEYS!</p>
                    <p className="text-xs text-gray-300">
                      Save your wallet address and private key safely
                      You need these to access your winnings
                      We cannot recover lost private keys
                      Do not share your private key with anyone
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="savedKey" 
                      checked={hasSavedKey}
                      onChange={(e) => setHasSavedKey(e.target.checked)}
                      className="w-4 h-4 text-blue-400 bg-gray-700 border-gray-600 rounded focus:ring-blue-400"
                    />
                    <label htmlFor="savedKey" className="text-sm text-blue-300 cursor-pointer">
                      I have saved my private key securely
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-transparent text-blue-300 border-blue-500 hover:bg-blue-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSpawn}
              disabled={!showWalletDetails || !showPrivateKey || !hasSavedKey}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!showWalletDetails ? 'Generate Wallet First' : (!showPrivateKey ? 'Unlock Private Key' : (!hasSavedKey ? 'Please confirm you saved your key' : 'Enter Game'))}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


// Physics component that handles ONLY position/velocity (animations handled separately)
const PhysicsSystem: React.FC<{ 
  players: Player[], 
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>> 
}> = ({ players, setPlayers }) => {
  useFrame((state, delta) => {
    setPlayers(prev => prev.map(player => {
      if (player.isFalling) {
        // Apply gravity to velocity
        const gravity = -50; // Strong gravity
        player.velocity.y += gravity * delta;
        
        // Update position based on velocity
        player.position.add(player.velocity.clone().multiplyScalar(delta));
      }
      
      return player;
    }));
  });
  
  return null; // This component doesn't render anything
};

// Local Player Component using shared animation utility
const LocalPlayer: React.FC<{ player: Player }> = ({ player }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !player.character?.group) return;

    // Position the group
    groupRef.current.position.set(player.position.x, player.position.y, 10);

    // Apply enhanced animation logic with proper hand grip poses
    // Use current time for consistent animation timing across all players
    applyHangerPose(player.character, {
      isHolding: player.isHolding,
      fallStart: player.fallStart,
      now: Date.now(),
    });
  });

  return (
    <group ref={groupRef}>
      <primitive 
        object={player.character.group}
        position={[0, 0, 0]}
      />
    </group>
  );
};

// Networked Player Component using shared animation utility
const NetworkedPlayer: React.FC<{ player: Player }> = ({ player }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lastPositionRef = useRef(player.position.clone());

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !player.character?.group) return;

    // Smooth interpolation for falling players to prevent stuttering
    if (player.isFalling) {
      // Simulate falling physics locally between network updates
      player.velocity.y += -50 * delta; // Apply gravity
      lastPositionRef.current.add(player.velocity.clone().multiplyScalar(delta));
      groupRef.current.position.set(lastPositionRef.current.x, lastPositionRef.current.y, 10);
      
      // Occasionally sync with network position to correct drift
      if (Math.abs(lastPositionRef.current.y - player.position.y) > 2) {
        lastPositionRef.current.copy(player.position);
      }
    } else {
      // For hanging players, use exact network position
      groupRef.current.position.set(player.position.x, player.position.y, 10);
      lastPositionRef.current.copy(player.position);
    }
    
    // Apply enhanced animation logic - SAME as local player
    // Use current time instead of clock.elapsedTime for consistent animation timing
    applyHangerPose(player.character, {
      isHolding: player.isHolding,
      fallStart: player.fallStart,
      now: Date.now(),
    });

    groupRef.current.visible = true;
  });

  return (
    <group ref={groupRef} position={[player.position.x, player.position.y, 10]}>
      <primitive 
        object={player.character.group}
        position={[0, 0, 0]}
      />
      
      {/* Player name tag */}
      <group position={[0, 3.5, 0]}>
        <mesh>
          <planeGeometry args={[3, 0.4]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
};

const HoldOnGame: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [showSpawnDialog, setShowSpawnDialog] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // Proper game state management
  const [spectatorMode, setSpectatorMode] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [isHoldingSpace, setIsHoldingSpace] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [jackpotAmount, setJackpotAmount] = useState(0);
  const [treasuryWallet] = useState('TREASURY_WALLET_ADDRESS_HERE');
  const [playerStartTime, setPlayerStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [supplyProgress, setSupplyProgress] = useState(0);
  const [showSupplyDispersed, setShowSupplyDispersed] = useState(false);
  const [supplyRewards, setSupplyRewards] = useState(0);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [finalScore, setFinalScore] = useState({ time: 0, rewards: 0, wallet: '', txHash: '', screenName: '' });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]); // All multiplayer players
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);

  // Check if first visit
  useEffect(() => {
    if (!localStorage.getItem('bridgeHelpSeen')) {
      setShowHelpOverlay(true);
    }
  }, []);

  // Spacebar handling with improved physics
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && myPlayerId && !e.repeat) {
        e.preventDefault();
        setIsHoldingSpace(true);
        // Update player's isHolding state
        setPlayers(prev => prev.map(player => 
          player.id === myPlayerId 
            ? { ...player, isHolding: true }
            : player
        ));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && myPlayerId) {
        e.preventDefault();
        setIsHoldingSpace(false);
        // Update player's isHolding state
        setPlayers(prev => prev.map(player => 
          player.id === myPlayerId 
            ? { ...player, isHolding: false }
            : player
        ));
        // Player starts falling when they release spacebar (only if game has started)
        if (gameStarted) {
          startPlayerFalling(myPlayerId);
          // Increase jackpot when player falls
          setJackpotAmount(prev => prev + 0.02);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, myPlayerId]);

  // Multiplayer synchronization with Supabase realtime
  useEffect(() => {
    if (!supabase) return;

    console.log('Setting up multiplayer channel...');

    // Use a fixed channel name that all clients will join
    const channel = supabase
      .channel('fantasy-game-lobby', {
        config: {
          broadcast: { self: true } // Include own messages for debugging
        }
      })
      .on('broadcast', { event: 'player_joined' }, (payload) => {
        console.log('Player joined:', payload.payload);
        const playerData = payload.payload as any;
        
        // Convert position back to Vector3 and add character
        const player: Player = {
          ...playerData,
          position: new THREE.Vector3(
            playerData.position.x,
            playerData.position.y,
            playerData.position.z
          ),
          velocity: new THREE.Vector3(0, 0, 0),
          character: new MemeHanger()
        };
        
        setAllPlayers(prev => {
          // Don't add if it's my own player or already exists
          if (prev.find(p => p.id === player.id)) return prev;
          console.log('Adding new player to allPlayers:', player.screenName);
          return [...prev, player];
        });
      })
      .on('broadcast', { event: 'player_position' }, (payload) => {
        const playerData = payload.payload as any;
        
        setAllPlayers(prev => {
          const existingIndex = prev.findIndex(p => p.id === playerData.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            const existingPlayer = updated[existingIndex];
            
            // Update position and state, but keep character object
            updated[existingIndex] = {
              ...existingPlayer,
              position: new THREE.Vector3(
                playerData.position.x,
                playerData.position.y,
                playerData.position.z
              ),
              isHolding: playerData.isHolding,
              isFalling: playerData.isFalling,
              // Keep existing character and other properties
              character: existingPlayer.character || new MemeHanger()
            };
            return updated;
          }
          return prev;
        });
      })
      .on('broadcast', { event: 'player_falling' }, (payload) => {
        console.log('Player falling:', payload.payload);
        const { id, isFalling, isHolding, fallStart } = payload.payload;
        
        setAllPlayers(prev => prev.map(player => 
          player.id === id 
            ? { 
                ...player, 
                isHolding: isHolding,
                isFalling: isFalling,
                fallStart: fallStart, // Use exact timestamp from broadcaster
                velocity: new THREE.Vector3(0, -2, 0)
              }
            : player
        ));
      })
      .on('broadcast', { event: 'player_left' }, (payload) => {
        console.log('Player left:', payload.payload);
        const playerId = payload.payload.id;
        setAllPlayers(prev => prev.filter(p => p.id !== playerId));
      })
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
      });

    // Handle page unload to notify other players
    const handleBeforeUnload = () => {
      if (myPlayerId) {
        channel.send({
          type: 'broadcast',
          event: 'player_left',
          payload: { id: myPlayerId }
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('Cleaning up multiplayer channel...');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Send leave message before cleanup
      if (myPlayerId) {
        channel.send({
          type: 'broadcast',
          event: 'player_left',
          payload: { id: myPlayerId }
        });
      }
      
      supabase.removeChannel(channel);
    };
  }, [myPlayerId]);

  // Broadcast player position updates every 100ms when playing
  useEffect(() => {
    if (!myPlayerId || spectatorMode) return;

    const interval = setInterval(async () => {
      const myPlayer = players.find(p => p.id === myPlayerId);
      if (myPlayer && supabase) {
        try {
          const channel = supabase.channel('fantasy-game-lobby');
          await channel.send({
            type: 'broadcast',
            event: 'player_position',
            payload: {
              id: myPlayer.id,
              position: {
                x: myPlayer.position.x,
                y: myPlayer.position.y,
                z: myPlayer.position.z
              },
              isHolding: myPlayer.isHolding,
              isFalling: myPlayer.isFalling
            }
          });
        } catch (error) {
          console.error('Error broadcasting position:', error);
        }
      }
    }, 100); // Update 10 times per second

    return () => clearInterval(interval);
  }, [myPlayerId, players, spectatorMode]);

  // Countdown management for proper game start
  useEffect(() => {
    if (showCountdown && countdownNumber > 0) {
      const timer = setTimeout(() => {
        setCountdownNumber(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdownNumber === 0) {
      // Countdown finished - start the game
      setTimeout(() => {
        setShowCountdown(false);
        setGameStarted(true);
        setPlayerStartTime(Date.now());
        
        // Check current player's isHolding state
        const myPlayer = players.find(p => p.id === myPlayerId);
        if (myPlayer && !myPlayer.isHolding) {
          startPlayerFalling(myPlayerId);
        }
      }, 1000); // Show "START!" for 1 second
    }
  }, [showCountdown, countdownNumber, myPlayerId, players]);

  // Fetch leaderboard on component mount
  useEffect(() => {
    fetchLeaderboard();
    
    // Set up real-time subscription for leaderboard updates
    const channel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'leaderboard' },
        () => {
          fetchLeaderboard(); // Refresh when new scores are added
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Add demo players for spectators when no real players are online
  useEffect(() => {
    if (spectatorMode && allPlayers.length === 0 && players.length === 0) {
      const demoPlayers: Player[] = [
        {
          id: 'demo-1',
          screenName: 'DemoPlayer1',
          wallet: 'DEMO_WALLET_1',
          position: new THREE.Vector3(-15, -0.5, 0),
          velocity: new THREE.Vector3(0, 0, 0),
          isHolding: true,
          isFalling: false,
          character: new MemeHanger()
        },
        {
          id: 'demo-2',
          screenName: 'DemoPlayer2',
          wallet: 'DEMO_WALLET_2',
          position: new THREE.Vector3(15, -0.5, 0),
          velocity: new THREE.Vector3(0, 0, 0),
          isHolding: true,
          isFalling: false,
          character: new MemeHanger()
        }
      ];
      setAllPlayers(demoPlayers);
    }
  }, [spectatorMode, allPlayers.length, players.length]);

  // Timer and supply progress tracking
  useEffect(() => {
    if (!gameStarted || !myPlayerId || !playerStartTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      const elapsedSeconds = Math.floor((now - playerStartTime) / 1000);
      const tenMinutesInSeconds = 600; // 10 minutes
      
      // Calculate progress within current 10-minute cycle
      const cycleElapsed = elapsedSeconds % tenMinutesInSeconds;
      const progress = (cycleElapsed / tenMinutesInSeconds) * 100;
      setSupplyProgress(progress);
      
      // Calculate total rewards (0.01% per 10 minutes)
      const completedCycles = Math.floor(elapsedSeconds / tenMinutesInSeconds);
      const currentCycleReward = (cycleElapsed / tenMinutesInSeconds) * 0.01;
      const totalRewards = (completedCycles * 0.01) + currentCycleReward;
      setSupplyRewards(totalRewards);
      
      // Check if 10 minutes completed
      if (elapsedSeconds > 0 && elapsedSeconds % tenMinutesInSeconds === 0) {
        setShowSupplyDispersed(true);
        setTimeout(() => {
          setShowSupplyDispersed(false);
        }, 3000); // Show message for 3 seconds
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, myPlayerId, playerStartTime]);

  // Additional countdown timer for visual updates
  useEffect(() => {
    if (!showCountdown || countdownNumber <= 0) return;

    const timer = setTimeout(() => {
      setCountdownNumber(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showCountdown, countdownNumber]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDetailedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${mins}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
  };

  const generateMockTransactionHash = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handlePlayAgain = () => {
    console.log('Play Again clicked');
    // Broadcast player leaving before reload
    if (myPlayerId && supabase) {
      const channel = supabase.channel('fantasy-game-lobby');
      channel.send({
        type: 'broadcast',
        event: 'player_left',
        payload: { id: myPlayerId }
      });
    }
    // Clear player ref
    myPlayerIdRef.current = undefined;
    window.location.reload();
  };

  const submitScore = async (screenName: string, walletAddress: string, timeHeldSeconds: number, supplyEarnedPercentage: number, transactionHash: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('submit_score_withoutcors', {
        body: {
          screenName,
          walletAddress,
          timeHeldSeconds,
          supplyEarnedPercentage,
          transactionHash
        }
      });
      
      if (error) {
        console.error('Error submitting score:', error);
      } else {
        console.log('Score submitted successfully:', data);
        fetchLeaderboard(); // Refresh leaderboard
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('time_held_seconds', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else {
        setLeaderboard(data || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleLeaderboard = () => {
    console.log('Leaderboard clicked');
    navigate('/leaderboard');
  };

  // Help Overlay Component
  const HelpOverlay = () => {
    const handleStartClimbing = () => {
      localStorage.setItem('bridgeHelpSeen', 'true');
      setShowHelpOverlay(false);
    };

    return (
      <div className="fixed inset-0 z-50 overflow-auto">
        {/* Backdrop - moved before content and added onClick */}
        <div 
          className="fixed inset-0 bg-blue-900/80 backdrop-blur-sm"
          onClick={handleStartClimbing}
        />
        
        <div className="flex min-h-full items-center justify-center p-4 relative z-10">
          {/* Modal */}
          <div 
            className="relative bg-gradient-to-br from-blue-800 to-purple-800 p-8 rounded-3xl max-w-2xl w-full border-4 border-yellow-400 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-5xl font-bold text-yellow-400 mb-6" style={{ fontFamily: 'monospace' }}>
                🚧 HOW TO PLAY 🚧
              </h2>
              
              <div className="bg-black/50 p-6 rounded-xl mb-6 border-2 border-blue-400 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">🧗</div>
                    <div>
                      <p className="text-xl text-yellow-300 font-bold">Hold SPACEBAR to cling</p>
                      <p className="text-sm text-blue-200">Keep holding to stay on the bridge!</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">💀</div>
                    <div>
                      <p className="text-xl text-red-300 font-bold">If you let go, you FALL!</p>
                      <p className="text-sm text-blue-200">Release spacebar = instant drop</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">💰</div>
                    <div>
                      <p className="text-xl text-green-300 font-bold">Each fall adds 0.02 SOL to the Supply Prize Pool</p>
                      <p className="text-sm text-blue-200">Watch the jackpot grow!</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">🏆</div>
                    <div>
                      <p className="text-xl text-yellow-300 font-bold">Last survivor wins it ALL!</p>
                      <p className="text-sm text-blue-200">Be the final holder to claim the entire jackpot</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-900/50 p-4 rounded-lg mb-6 border-2 border-orange-400">
                <p className="text-orange-300 font-bold mb-2">💰 Winnings are sent straight to your connected wallet.</p>
                <p className="text-orange-300 font-bold">🔑 KEEP YOUR PRIVATE KEY SAFE – we can't recover lost keys!</p>
              </div>
              
              <div className="text-xl text-yellow-300 font-bold mb-6">
                Good luck, brave climber! 🧗
              </div>
              
              <button 
                type="button"
                onClick={handleStartClimbing}
                className="relative overflow-visible bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-xl text-2xl transition-colors focus:outline-none focus:ring-4 focus:ring-green-400"
                style={{ 
                  fontFamily: 'monospace',
                  pointerEvents: 'all'
                }}
              >
                <span className="relative z-10 pointer-events-none">Start Holding</span>
                {/* Pulse effect that doesn't affect click area */}
                <div 
                  className="absolute inset-0 rounded-xl bg-green-400 pointer-events-none"
                  style={{
                    animation: 'pulseGlow 2s ease-in-out infinite'
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const startPlayerFalling = async (playerId: string) => {
    const fallStart = Date.now();
    
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { 
            ...player, 
            isHolding: false, 
            isFalling: true,
            fallStart: fallStart,
            velocity: new THREE.Vector3(0, 0, 0) // Start with zero velocity
          }
        : player
    ));
    
    // Broadcast that this player is falling with fallStart timestamp
    if (playerId === myPlayerId && supabase) {
      try {
        const channel = supabase.channel('fantasy-game-lobby');
        await channel.send({
          type: 'broadcast',
          event: 'player_falling',
          payload: {
            id: playerId,
            isFalling: true,
            isHolding: false,
            fallStart: fallStart
          }
        });
        console.log('Broadcasted player falling with timestamp:', playerId, fallStart);
      } catch (error) {
        console.error('Error broadcasting player falling:', error);
      }
    }
    
    // Calculate final score and show congratulations when player falls
    if (playerId === myPlayerId && playerStartTime) {
      const fallTime = Date.now();
      const totalHoldTime = (fallTime - playerStartTime) / 1000; // in seconds
      const finalRewards = supplyRewards;
      const playerWallet = players.find(p => p.id === playerId)?.wallet || '';
      
      // Generate mock transaction hash (in real implementation, this would come from actual Solana transaction)
      const mockTxHash = generateMockTransactionHash();
      
      const playerScreenName = players.find(p => p.id === playerId)?.screenName || '';
      
      setFinalScore({
        time: totalHoldTime,
        rewards: finalRewards,
        wallet: playerWallet,
        txHash: mockTxHash,
        screenName: playerScreenName
      });
      
      // Submit score to leaderboard
      submitScore(playerScreenName, playerWallet, totalHoldTime, finalRewards, mockTxHash);
      
      // Wait 2 seconds before showing congratulations screen
      setTimeout(() => {
        setShowCongratulations(true);
      }, 2000);
      
      // Reset player timer
      setPlayerStartTime(null);
      setSupplyProgress(0);
      setSupplyRewards(0);
    }
  };

  const handleSpawn = async (screenName: string, wallet: string, privateKey: string) => {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      screenName,
      wallet,
      privateKey,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 40, // Random position between bridge pillars (-20 to +20)
        -0.5, // Higher position so hands reach the bridge at y=0
        0
      ),
      velocity: new THREE.Vector3(0, 0, 0),
      isHolding: true,
      isFalling: false,
      character: new MemeHanger()
    };
    
    // Add to local players (this is ME)
    setPlayers(prev => [...prev, newPlayer]);
    setMyPlayerId(newPlayer.id);
    myPlayerIdRef.current = newPlayer.id; // Set non-reactive ref
    setSpectatorMode(false); // Exit spectator mode when playing
    
    // Broadcast to other clients via Supabase realtime
    try {
      const channel = supabase.channel('fantasy-game-lobby');
      await channel.send({
        type: 'broadcast',
        event: 'player_joined',
        payload: {
          id: newPlayer.id,
          screenName: newPlayer.screenName,
          wallet: newPlayer.wallet,
          position: {
            x: newPlayer.position.x,
            y: newPlayer.position.y,
            z: newPlayer.position.z
          },
          isHolding: newPlayer.isHolding,
          isFalling: newPlayer.isFalling
        }
      });
      console.log('Broadcasted player join:', newPlayer.screenName);
    } catch (error) {
      console.error('Error broadcasting player spawn:', error);
    }
    
    setShowSpawnDialog(false);
    // Don't automatically set holding space - wait for user input
    setIsHoldingSpace(false);
    setShowCountdown(true);
    setCountdownNumber(3);
  };

  return (
    <div className="w-full h-screen relative">
      {/* Runey Toons UI in top right corner */}
      <div className="absolute top-4 right-4 z-30">
        <img 
          src="/runey-toons-ui.png" 
          alt="Runey Toons UI" 
          className="w-48 h-48 object-contain"
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))'
          }}
        />
      </div>
      
      {/* Suspended Scoreboard - Metal Road Sign Style */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 text-center">
        <div 
          className="relative max-w-4xl mx-auto"
          style={{
            background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
            borderRadius: '12px',
            padding: '2rem 3rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '4px solid #444',
            transform: 'perspective(1000px) rotateX(5deg)'
          }}
        >
          {/* Bolt decorations */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-gray-500 rounded-full shadow-lg"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-gray-500 rounded-full shadow-lg"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gray-500 rounded-full shadow-lg"></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gray-500 rounded-full shadow-lg"></div>
          
          <div className="mb-4">
            <h3 
              className="text-2xl mb-2"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                color: '#9fffb5',
                textShadow: '0 0 8px #42ff75, 0 0 20px #42ff75',
                letterSpacing: '2px'
              }}
            >
              SUPPLY PRIZE POOL
            </h3>
            <div 
              className="text-5xl mb-2"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                color: '#9fffb5',
                textShadow: '0 0 12px #42ff75, 0 0 30px #42ff75',
                letterSpacing: '3px'
              }}
            >
              {jackpotAmount.toFixed(2)} SOL
            </div>
            <p 
              className="text-lg"
              style={{
                fontFamily: '"Orbitron", sans-serif',
                color: '#ffff99',
                textShadow: '0 0 6px #ffff00',
                fontWeight: 'bold'
              }}
            >
              LAST HOLDER GETS FUNDED!
            </p>
          </div>
          
          {/* Progress indicator with LED style */}
          <div className="relative h-8 bg-gray-900 rounded-lg overflow-hidden shadow-inner mb-3">
            <div 
              className="h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min((jackpotAmount / 10) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #42ff75 0%, #9fffb5 100%)',
                boxShadow: 'inset 0 0 10px rgba(66, 255, 117, 0.5)'
              }}
            />
            <div 
              className="absolute inset-0 flex items-center justify-center text-sm font-bold"
              style={{
                fontFamily: '"Orbitron", sans-serif',
                color: '#ffffff',
                textShadow: '0 0 4px rgba(0,0,0,0.8)'
              }}
            >
              Progress: {jackpotAmount.toFixed(2)} / 10 SOL
            </div>
          </div>
        </div>
      </div>
      {/* 3D Scene with fixed camera */}
      <Canvas camera={{ 
        position: [0, 5, 45], 
        fov: 65,
        rotation: [-0.1, 0, 0]
      }}>
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 30, 15]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={150}
          shadow-camera-left={-80}
          shadow-camera-right={80}
          shadow-camera-top={80}
          shadow-camera-bottom={-80}
        />
        <pointLight position={[-10, 15, -5]} intensity={0.8} />
        <pointLight position={[10, 15, 5]} intensity={0.8} />
        
        {/* Realistic sky with fog effect */}
        <fog attach="fog" args={['#87CEEB', 50, 200]} />
        <mesh>
          <sphereGeometry args={[300, 32, 32]} />
          <meshBasicMaterial 
            color="#87CEEB" 
            side={THREE.BackSide}
          />
        </mesh>
        
        <Bridge />
        <SlowFreeway />
        
        {/* Physics system */}
        <PhysicsSystem players={players} setPlayers={setPlayers} />
        
        {/* Render MY player with physics - using shared animations */}
        {players.map((player) => (
          <LocalPlayer key={player.id} player={player} />
        ))}
        
        {/* Render OTHER multiplayer players with proper characters and animations */}
        {allPlayers.filter(p => p.id !== myPlayerId).map((player) => {
          // Create character for networked player if not exists
          if (!player.character) {
            player.character = new MemeHanger();
          }
          
          return (
            <NetworkedPlayer 
              key={`other-${player.id}`} 
              player={player}
            />
          );
        })}
        
        {/* No camera controls - fixed view */}
      </Canvas>
      
      {/* Countdown Overlay */}
      {showCountdown && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="text-9xl font-bold text-white mb-4">
              {countdownNumber > 0 ? countdownNumber : "START!"}
            </div>
            <div className="text-2xl text-yellow-400 font-bold mb-8">
              {countdownNumber > 0 ? "GET READY..." : "HOLD SPACEBAR!"}
            </div>
            <div className="text-lg text-white bg-red-600 px-6 py-3 rounded-lg">
              {isHoldingSpace ? "✅ HOLDING SPACEBAR" : "⚠️ PRESS AND HOLD SPACEBAR NOW!"}
            </div>
          </div>
        </div>
      )}

      {/* Launch Pad Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        {spectatorMode && !showCountdown && (
          <div className="relative">
            {/* Blinking arrows pointing to button */}
            <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 text-yellow-400 text-4xl animate-pulse">➤</div>
            <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-yellow-400 text-4xl animate-pulse">➤</div>
            
            <button 
              onClick={() => setShowSpawnDialog(true)}
              className="relative overflow-hidden transition-all transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
                border: '4px solid #ff6666',
                borderRadius: '16px',
                padding: '2rem 4rem',
                boxShadow: '0 8px 32px rgba(255, 0, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '1.2rem',
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                letterSpacing: '1px'
              }}
            >
              {/* Animated hydraulic effect */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                  animation: 'slide 2s linear infinite'
                }}
              />
              <span className="relative z-10">SPAWN IN AND HOLD TO RECEIVE SUPPLY</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Safety Ticker - Bottom Center */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div 
          className="h-10 overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, #ff6600 0%, #ff9900 100%)',
            borderTop: '3px solid #333'
          }}
        >
          <div 
            className="h-full flex items-center whitespace-nowrap"
            style={{
              animation: 'scroll-left 30s linear infinite',
              fontFamily: '"Orbitron", monospace',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            <span className="px-8">
              ⚠️ SAVE YOUR PRIVATE KEY - WE CANNOT RECOVER LOST KEYS ⚠️ • 
              🔑 KEEP YOUR WALLET INFORMATION SECURE 🔑 • 
              💾 BACKUP YOUR CREDENTIALS BEFORE PLAYING 💾 • 
              ⚠️ SAVE YOUR PRIVATE KEY - WE CANNOT RECOVER LOST KEYS ⚠️ • 
              🔑 KEEP YOUR WALLET INFORMATION SECURE 🔑 • 
              💾 BACKUP YOUR CREDENTIALS BEFORE PLAYING 💾 •
            </span>
          </div>
        </div>
      </div>
      
      {/* Hanging Walkie-Talkie HUD */}
      <div className="absolute top-20 right-4 z-10">
        <div 
          className="relative"
          style={{
            background: '#1a1f2e',
            border: '3px solid #4d5370',
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            width: '200px',
            transform: 'rotate(2deg)',
            transformOrigin: 'top center'
          }}
        >
          {/* Antenna */}
          <div 
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gray-600"
            style={{ borderRadius: '2px' }}
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Live player count with LED display */}
          <div 
            className="mb-4 p-3 bg-black rounded-lg"
            style={{
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
              border: '1px solid #333'
            }}
          >
            <div 
              className="text-center"
              style={{
                fontFamily: '"Orbitron", monospace',
                color: '#42ff75',
                textShadow: '0 0 8px #42ff75',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              <div className="text-xs opacity-80 mb-1">LIVE ON BRIDGE</div>
              <div className="text-3xl">{players.filter(p => p.isHolding).length}</div>
            </div>
          </div>
          
          {/* Leaderboard button */}
          <button 
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-full py-2 px-3 rounded-lg transition-all transform hover:scale-105"
            style={{
              background: showLeaderboard ? '#ff4444' : '#cc0000',
              color: '#ffffff',
              fontFamily: '"Orbitron", sans-serif',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(204, 0, 0, 0.4)',
              border: '2px solid #ff6666'
            }}
          >
            🏅 {showLeaderboard ? 'HIDE' : 'SHOW'} LEADERBOARD
          </button>
        </div>
        
        {/* Leaderboard Display */}
        {showLeaderboard && (
          <div 
            className="mt-4 p-4 max-w-sm"
            style={{
              background: '#1a1f2e',
              border: '3px solid #4d5370',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
            }}
          >
            <h3 
              className="text-lg font-bold mb-3 text-center"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                color: '#ffcc00',
                textShadow: '0 0 8px #ff9900',
                fontSize: '0.875rem'
              }}
            >
              🏆 TOP HOLDERS
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="p-3 rounded-lg text-xs"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid #4d5370'
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span 
                        style={{
                          fontFamily: '"Orbitron", sans-serif',
                          color: '#ffcc00',
                          fontWeight: 'bold'
                        }}
                      >
                        #{index + 1} {entry.screen_name}
                      </span>
                      <span 
                        style={{
                          fontFamily: '"Press Start 2P", monospace',
                          color: '#42ff75',
                          fontSize: '0.7rem'
                        }}
                      >
                        {entry.time_held_seconds.toFixed(2)}s
                      </span>
                    </div>
                    <div 
                      className="mb-1"
                      style={{
                        color: '#ffff99',
                        fontFamily: '"Orbitron", sans-serif',
                        fontSize: '0.75rem'
                      }}
                    >
                      {parseFloat(entry.supply_earned_percentage).toFixed(6)}% supply
                    </div>
                    <div 
                      className="break-all mb-1"
                      style={{
                        color: '#888',
                        fontFamily: 'monospace',
                        fontSize: '0.65rem'
                      }}
                    >
                      {entry.wallet_address.slice(0, 8)}...{entry.wallet_address.slice(-8)}
                    </div>
                    <a 
                      href={`https://solscan.io/tx/${entry.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1"
                      style={{
                        color: '#66ccff',
                        fontSize: '0.7rem',
                        textDecoration: 'underline',
                        fontFamily: '"Orbitron", sans-serif'
                      }}
                    >
                      View TX
                    </a>
                  </div>
                ))
              ) : (
                <p 
                  className="text-center"
                  style={{
                    color: '#888',
                    fontFamily: '"Orbitron", sans-serif'
                  }}
                >
                  No scores yet!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      
      <SpawnDialog 
        isOpen={showSpawnDialog}
        onSpawn={handleSpawn}
        onClose={() => setShowSpawnDialog(false)}
      />
      
      {/* Congratulations Screen - Simple Overlay */}
      {showCongratulations && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-purple-800 to-blue-800 p-8 rounded-2xl max-w-2xl w-full border-4 border-yellow-400 shadow-2xl">
            <div className="text-center">
              <h2 className="text-6xl font-bold text-yellow-400 mb-6 comic-font">
                🎉 CONGRATULATIONS! 🎉
              </h2>
              
              <div className="bg-black/50 p-6 rounded-xl mb-6 border border-purple-400">
                <h3 className="text-3xl font-bold text-white mb-4 bubble-font">YOUR FINAL SCORE</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <span className="text-blue-300 font-semibold bubble-font">TIME HELD: </span>
                    <div className="text-4xl font-bold text-yellow-300 comic-font">
                      {Math.floor(finalScore.time / 60)}:{(finalScore.time % 60).toFixed(2).padStart(5, '0')} MINUTES
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-green-300 font-semibold bubble-font">SUPPLY EARNED: </span>
                    <div className="text-4xl font-bold text-green-300 comic-font">
                      {finalScore.rewards.toFixed(6)}%
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-purple-400 pt-4">
                  <h4 className="text-2xl text-white font-bold mb-4 bubble-font">TRANSACTION DETAILS</h4>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <span className="text-blue-300 font-semibold bubble-font">Sent to Wallet:</span>
                      <div className="bg-black/50 p-2 rounded font-mono text-xs break-all text-blue-200 mt-1">
                        {finalScore.wallet}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-green-300 font-semibold bubble-font">Transaction Hash:</span>
                      <div className="bg-black/50 p-2 rounded font-mono text-xs break-all text-green-200 mt-1">
                        {finalScore.txHash}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <a 
                      href={`https://solscan.io/tx/${finalScore.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors bubble-font"
                    >
                      View on Solscan
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center mt-8">
                <button 
                  onClick={() => navigate('/leaderboard')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg text-lg comic-font transition-colors"
                >
                  See Leaderboard
                </button>
                
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg comic-font transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Overlay */}
      {showHelpOverlay && <HelpOverlay />}
      
      {/* Animation Styles */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(20px);
          }
        }
        
        @keyframes pulseGlow {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.3;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.95);
          }
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Orbitron:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
};

export default HoldOnGame;