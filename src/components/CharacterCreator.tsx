import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { BodyTypeBCharacter } from './BodyTypeBCharacter';
import { generateWallet, generateTokenMintAddress } from '../utils/walletGenerator';
import { debugDatabaseTable } from '../utils/debugDatabase';
import '../styles/CharacterCreator.css';

interface TabOption {
  id: string;
  name: string;
  category: 'skin' | 'shirt' | 'pants';
}

const skinColors: TabOption[] = [
  { id: 'white', name: 'White', category: 'skin' },
  { id: 'black', name: 'Black', category: 'skin' },
];

const shirtOptions: TabOption[] = [
  { id: 'red', name: 'Red', category: 'shirt' },
  { id: 'green', name: 'Green', category: 'shirt' },
  { id: 'yellow', name: 'Yellow', category: 'shirt' },
  { id: 'purple', name: 'Purple', category: 'shirt' },
  { id: 'blue', name: 'Blue', category: 'shirt' },
];

const pantsOptions: TabOption[] = [
  { id: 'red', name: 'Red', category: 'pants' },
  { id: 'green', name: 'Green', category: 'pants' },
  { id: 'yellow', name: 'Yellow', category: 'pants' },
  { id: 'purple', name: 'Purple', category: 'pants' },
  { id: 'blue', name: 'Blue', category: 'pants' },
];

// Player Preview Component using the customized models
function PlayerPreview({ 
  rotation, 
  shirt,
  pants,
  skin,
  offsetX,
  offsetY
}: { 
  rotation: number; 
  shirt: string;
  pants: string;
  skin: string;
  offsetX: number;
  offsetY: number;
}) {
  const modelPath = `/models/${shirt}_${pants}_${skin}.glb`;
  const { scene } = useGLTF(modelPath);
  const groupRef = React.useRef<THREE.Group>(null);
  
  // Auto-rotate the preview
  React.useEffect(() => {
    if (!groupRef.current) return;
    
    let animationId: number;
    const animate = () => {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.01;
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  if (!scene) return null;
  
  // Render the model EXACTLY like in the game
  return (
    <group ref={groupRef} position={[0, -3, 0]}>
      <primitive 
        object={scene} 
        scale={[65, 65, 65]} 
        position={[0, 3, 26]} 
      />
    </group>
  );
}

interface CharacterCreatorProps {
  onComplete?: () => void;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [selectedSkin, setSelectedSkin] = useState(0);
  const [selectedShirt, setSelectedShirt] = useState(0);
  const [selectedPants, setSelectedPants] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);


  // Check username availability
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true);
      try {
        // First, let's check what columns are available
        console.log('Checking username availability for:', username);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')  // Select all to see what we get
          .eq('username', username)
          .maybeSingle();  // Use maybeSingle instead of single

        console.log('Username check response:', { data, error });

        if (error) {
          console.error('Username check error:', error);
          // If column doesn't exist, still allow username
          if (error.code === '42703') {
            console.warn('Username column not found, allowing username');
            setUsernameAvailable(true);
          } else if (error.code === 'PGRST116') {
            // No rows returned means username is available
            setUsernameAvailable(true);
          } else {
            setUsernameAvailable(true); // Allow on any error for now
          }
        } else if (data) {
          // Username exists
          setUsernameAvailable(false);
        } else {
          // No data means username is available
          setUsernameAvailable(true);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(true); // Allow on error
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [username]);

  const handleConfirm = async () => {
    if (!username || username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    // Temporarily skip username availability check due to column issue
    // if (!usernameAvailable) {
    //   toast.error('Username is already taken');
    //   return;
    // }

    try {
      // Generate wallet for the user
      const wallet = generateWallet();
      const tokenMintAddress = generateTokenMintAddress();

      console.log('Attempting to create user with:', {
        username,
        walletPublicKey: wallet.publicKey
      });

      // Create user in database
      const characterModel = `${shirtOptions[selectedShirt].id}_${pantsOptions[selectedPants].id}_${skinColors[selectedSkin].id}.glb`;
      
      const insertData = {
        username: username,
        wallet_public_key: wallet.publicKey,
        wallet_private_key: wallet.privateKey,
        token_mint_address: tokenMintAddress,
        character_model: characterModel,
        body_type: 'A',
        shirt_color: shirtOptions[selectedShirt].id,
        pants_color: pantsOptions[selectedPants].id,
        skin_color: skinColors[selectedSkin].id
      };

      console.log('Inserting data:', insertData);

      // First check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
        
      if (existingUser) {
        toast.error('Username already taken. Please choose another.');
        return;
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        toast.error(`Failed to create user: ${userError.message}`);
        
        // Save to localStorage as fallback
        const characterData = {
          userId: 'local-' + Date.now(),
          username,
          bodyType: 'A',
          characterModel: characterModel,
          shirtColor: shirtOptions[selectedShirt].id,
          pantsColor: pantsOptions[selectedPants].id,
          skinColor: skinColors[selectedSkin].id,
          walletPublicKey: wallet.publicKey,
          walletPrivateKey: wallet.privateKey,
          tokenMintAddress: tokenMintAddress
        };
        
        localStorage.setItem('characterData', JSON.stringify(characterData));
        localStorage.setItem('userId', characterData.userId);
        localStorage.setItem('username', username);
        
        // Preload the character model
        if (characterData.characterModel) {
          useGLTF.preload(`/models/${characterData.characterModel}`);
        }
        
        return;
      }

      // Store character data with user ID from database
      const characterData = {
        userId: userData.id,
        username: userData.username,
        bodyType: userData.body_type,
        characterModel: userData.character_model,
        shirtColor: userData.shirt_color || shirtOptions[selectedShirt].id,
        pantsColor: userData.pants_color || pantsOptions[selectedPants].id,
        skinColor: userData.skin_color || skinColors[selectedSkin].id,
        walletPublicKey: userData.wallet_public_key,
        tokenMintAddress: userData.token_mint_address
      };
      
      localStorage.setItem('characterData', JSON.stringify(characterData));
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('username', userData.username);
      
      // Preload the character model - CRITICAL for animations to work properly!
      // EXACTLY THE SAME AS LOGIN FLOW
      if (userData.character_model) {
        const { useGLTF } = await import('@react-three/drei');
        useGLTF.preload(`/models/${userData.character_model}`);
        console.log('[CharacterCreator] Preloading model:', userData.character_model);
      }
      
      toast.success('Character created successfully!');
      
      // Create token for the user
      console.log('Creating token for user...');
      try {
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('create-runescape-token', {
          body: {
            userId: userData.id,
            username: userData.username
          }
        });
        
        if (tokenError) {
          console.error('Token creation error:', tokenError);
          toast.error('Character created but token creation failed');
        } else if (tokenData?.success) {
          console.log('Token created successfully:', tokenData);
          toast.success(`Token created! View on LetsBonk: ${tokenData.letsBonkUrl}`);
          
          // Update local storage with token info
          characterData.mintAddress = tokenData.mintAddress;
          characterData.marketCap = tokenData.marketCap;
          characterData.letsBonkUrl = tokenData.letsBonkUrl;
          localStorage.setItem('characterData', JSON.stringify(characterData));
        }
      } catch (error) {
        console.error('Error invoking token creation:', error);
        toast.error('Character created but token creation failed');
      }
      
      // Set navigation flag to unmount Canvas BEFORE transitioning
      // This prevents WebGL context conflicts between preview and game
      setIsNavigating(true);
      
      // Wait for Canvas to fully unmount and WebGL to clean up
      setTimeout(() => {
        // FORCE PAGE RELOAD WITH AUTO-LOGIN
        // This ensures clean state and prevents all WebGL/Supabase issues
        console.log('[CharacterCreator] Forcing page reload with auto-login for:', username);
        
        // Set auto-login flags
        localStorage.setItem('autoLoginUsername', username);
        localStorage.setItem('shouldAutoLogin', 'true');
        
        // Force a page reload to clear all state and start fresh
        window.location.href = '/';
      }, 200); // Slightly longer delay to ensure Canvas fully unmounts first
    } catch (error) {
      console.error('Error in character creation:', error);
      toast.error('Failed to create character');
    }
  };

  const renderColorOption = (label: string, options: TabOption[], selectedIndex: number, onPrev: () => void, onNext: () => void) => {
    return (
      <div className="color-option-row">
        <button className="arrow-button" onClick={onPrev}>◄</button>
        <span className="option-label">{label}</span>
        <button className="arrow-button" onClick={onNext}>►</button>
      </div>
    );
  };

  return (
    <div className="character-creator-container">
      <div className="character-creator">
        <div className="creator-header">
          <h1>Character Creator</h1>
          <div className="username-section-header">
            <label className="username-label">Set your screen name</label>
            <div className="username-input-wrapper-header">
              <Input
                type="text"
                placeholder="Enter username (max 32 characters)"
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 32))}
                className="username-input-header"
                maxLength={32}
              />
              {isCheckingUsername && (
                <span className="username-status checking">Checking...</span>
              )}
              {!isCheckingUsername && usernameAvailable === true && username.length >= 3 && (
                <span className="username-status available">✓ Available</span>
              )}
              {!isCheckingUsername && usernameAvailable === false && (
                <span className="username-status taken">✗ Taken</span>
              )}
            </div>
          </div>
        </div>

        <div className="creator-content">
          <div className="left-section">
            <div 
              className="character-preview"
            >
              {!isNavigating && (
                <Canvas>
                  <PerspectiveCamera makeDefault position={[0, 5, 30]} fov={40} />
                  <ambientLight intensity={0.8} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <directionalLight position={[-10, 10, -5]} intensity={0.5} />
                  <Suspense fallback={null}>
                    <PlayerPreview 
                      rotation={0} 
                      shirt={shirtOptions[selectedShirt].id}
                      pants={pantsOptions[selectedPants].id}
                      skin={skinColors[selectedSkin].id}
                      offsetX={0}
                      offsetY={0}
                    />
                  </Suspense>
                </Canvas>
              )}
            </div>
          </div>

          <div className="right-section">
            <div className="tab-header">Colour</div>
            <div className="color-options">
              {renderColorOption(
                'Skin', 
                skinColors, 
                selectedSkin,
                () => setSelectedSkin((prev) => (prev - 1 + skinColors.length) % skinColors.length),
                () => setSelectedSkin((prev) => (prev + 1) % skinColors.length)
              )}
              {renderColorOption(
                'Shirt', 
                shirtOptions, 
                selectedShirt,
                () => setSelectedShirt((prev) => (prev - 1 + shirtOptions.length) % shirtOptions.length),
                () => setSelectedShirt((prev) => (prev + 1) % shirtOptions.length)
              )}
              {renderColorOption(
                'Pants', 
                pantsOptions, 
                selectedPants,
                () => setSelectedPants((prev) => (prev - 1 + pantsOptions.length) % pantsOptions.length),
                () => setSelectedPants((prev) => (prev + 1) % pantsOptions.length)
              )}
            </div>
            <div className="confirm-section">
              <Button
                className="confirm-button"
                onClick={handleConfirm}
                disabled={!username || username.length < 3}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CHARACTER CREATION FLOW:
// 1. User creates character and data is saved to database/localStorage
// 2. Model is preloaded for the game (not the preview)
// 3. We set auto-login flags in localStorage with the username
// 4. Navigate to home page which shows the login popup
// 5. Login popup detects auto-login flags and automatically logs in
// 6. This uses the EXACT SAME login flow that already works perfectly
// 7. Eliminates all dual-render issues and ensures animations work correctly