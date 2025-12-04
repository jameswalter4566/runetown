import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import '../styles/CharacterLoginPopup.css';

interface CharacterLoginPopupProps {
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export const CharacterLoginPopup: React.FC<CharacterLoginPopupProps> = ({ onClose, onLoginSuccess }) => {
  const navigate = useNavigate();
  
  // Check for auto-login data from character creation
  const autoLoginUsername = localStorage.getItem('autoLoginUsername');
  const shouldAutoLogin = localStorage.getItem('shouldAutoLogin') === 'true';
  
  const [username, setUsername] = useState(autoLoginUsername || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = React.useCallback(async () => {
    if (!username || username.length < 3) {
      toast.error('Please enter a valid username');
      return;
    }

    setIsLoading(true);
    try {
      // Debug: Log what we're searching for
      console.log('Searching for username:', username);
      console.log('Username length:', username.length);
      
      // Trim whitespace from username
      const trimmedUsername = username.trim();
      console.log('Trimmed username:', trimmedUsername);
      
      // Fetch user data from database - case insensitive
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', trimmedUsername) // Case-insensitive search
        .maybeSingle(); // Use maybeSingle to handle 0 or 1 results

      console.log('Query result:', { userData, error });

      if (error && error.code !== 'PGRST116') {
        // Only show error if it's not a "no rows" error
        console.error('Database error:', error);
        toast.error('Database error. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!userData) {
        // Let's also try to see all users for debugging
        const { data: allUsers } = await supabase
          .from('users')
          .select('username')
          .limit(10);
        console.log('Sample usernames in database:', allUsers);
        
        toast.error('Character not found. Please check your username or create a new character.');
        setIsLoading(false);
        return;
      }

      // Store character data in localStorage
      const characterData = {
        userId: userData.id,
        username: userData.username,
        bodyType: userData.body_type || 'A',
        characterModel: userData.character_model,
        shirtColor: userData.shirt_color,
        pantsColor: userData.pants_color,
        skinColor: userData.skin_color,
        walletPublicKey: userData.wallet_public_key,
        tokenMintAddress: userData.token_mint_address
      };
      
      localStorage.setItem('characterData', JSON.stringify(characterData));
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('username', userData.username);
      
      // Preload the character model - CRITICAL for animations to work properly!
      if (userData.character_model) {
        const { useGLTF } = await import('@react-three/drei');
        useGLTF.preload(`/models/${userData.character_model}`);
        console.log('[CharacterLogin] Preloading model:', userData.character_model);
      }
      
      toast.success(`Welcome back, ${userData.username}!`);
      
      console.log('Login successful, calling callbacks...');
      
      // Add a small delay to ensure model is preloaded before triggering success callback
      // This matches the behavior of character creation where there's a natural delay
      setTimeout(() => {
        // Close popup and trigger success callback
        if (onLoginSuccess) {
          console.log('Calling onLoginSuccess callback after model preload');
          onLoginSuccess();
        } else {
          console.log('No onLoginSuccess callback provided');
        }
        onClose();
      }, 100); // Small delay to ensure preload completes
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [username, onLoginSuccess, onClose, navigate]);
  
  // Effect to handle auto-login
  React.useEffect(() => {
    if (shouldAutoLogin && autoLoginUsername) {
      console.log('[CharacterLogin] Auto-login triggered for:', autoLoginUsername);
      // Clear the auto-login flags
      localStorage.removeItem('autoLoginUsername');
      localStorage.removeItem('shouldAutoLogin');
      // Trigger login automatically
      setTimeout(() => {
        handleLogin();
      }, 500); // Small delay to ensure UI is ready
    }
  }, [shouldAutoLogin, autoLoginUsername, handleLogin]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="character-login-overlay" onClick={onClose}>
      <div className="character-login-popup" onClick={(e) => e.stopPropagation()}>
        <div className="login-popup-header">
          <h2>Character Login</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '10px 0',
          borderBottom: '1px solid #4a3f2a',
          marginBottom: '10px'
        }}>
          <a 
            href="https://x.com/runesoldotfun" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#ffb366',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff9933'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ffb366'}
          >
            🐦 Follow @runesoldotfun
          </a>
        </div>
        
        <div className="login-popup-content">
          <div className="login-input-section">
            <label htmlFor="username">Enter your character name:</label>
            <Input
              id="username"
              type="text"
              placeholder="Character name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="character-name-input"
              maxLength={20}
              autoFocus
            />
          </div>
          
          <div className="login-button-section">
            <Button
              className="login-confirm-button"
              onClick={handleLogin}
              disabled={!username || username.length < 3 || isLoading}
            >
              {isLoading ? 'Loading...' : 'Login'}
            </Button>
          </div>
          
          <div className="login-help-text">
            <p>Don't have a character? <a href="#" onClick={(e) => { 
              e.preventDefault(); 
              onClose();
              // Trigger character creation by clicking the create button
              const createButton = document.querySelector('button');
              const buttons = Array.from(document.querySelectorAll('button'));
              const createBtn = buttons.find(btn => btn.textContent?.includes('Create New Adventurer'));
              if (createBtn) {
                createBtn.click();
              }
            }}>Create one</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};