import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PlayNowPopup from "@/components/PlayNowPopup";
import RunescapeWorld from "@/components/RunescapeWorld";
import { CharacterCreator } from "@/components/CharacterCreator";
import { CharacterLoginPopup } from "@/components/CharacterLoginPopup";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Character data management
  const characterData = localStorage.getItem('characterData');
  const shouldAutoLogin = localStorage.getItem('shouldAutoLogin') === 'true';
  
  // Show login popup on first load or if auto-login is requested
  const [showLogin, setShowLogin] = useState(!shouldAutoLogin);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(shouldAutoLogin);
  const [playerData, setPlayerData] = useState(null);
  const [isInGame, setIsInGame] = useState(false);

  useEffect(() => {
    // Clear player data when showing character creator
    if (showCharacterCreator) {
      setPlayerData(null);
    }
  }, [showCharacterCreator]);

  const handleCreatePenguin = () => {
    // Clear any existing character data and show character creator
    localStorage.removeItem('characterData');
    localStorage.removeItem('userId');
    setPlayerData(null);
    setShowLogin(false);
    setShowCharacterCreator(true);
  };


  return (
    <>
      {/* Three.js World Component - Always rendered in background */}
      <RunescapeWorld playerData={playerData} />

      {/* Character Creator Overlay */}
      {showCharacterCreator && (
        <div className="fixed inset-0 z-50">
          <CharacterCreator />
        </div>
      )}

      {/* Login Popup - On top of Three.js */}
      {showLogin && !showCharacterCreator && !isInGame && (
        <PlayNowPopup 
          onClose={() => setShowLogin(false)}
          onLogin={() => {
            setShowLogin(false);
            setShowLoginPopup(true);
          }}
          onCreatePenguin={handleCreatePenguin}
        />
      )}

      {/* Character Login Popup */}
      {showLoginPopup && (
        <CharacterLoginPopup 
          onClose={() => {
            setShowLoginPopup(false);
            // Show main menu again if no character is loaded
            if (!playerData) {
              setShowLogin(true);
            }
          }}
          onLoginSuccess={() => {
            console.log('onLoginSuccess called in Index.tsx');
            // Load character data after successful login
            const newCharacterData = localStorage.getItem('characterData');
            console.log('Character data from localStorage:', newCharacterData);
            if (newCharacterData) {
              const parsedData = JSON.parse(newCharacterData);
              // Also get userId if it's stored separately
              const userId = localStorage.getItem('userId') || parsedData.userId;
              const playerDataWithUserId = { ...parsedData, userId };
              console.log('Setting player data:', playerDataWithUserId);
              setPlayerData(playerDataWithUserId);
            }
            setShowLoginPopup(false);
            setShowLogin(false);
            setIsInGame(true); // Mark as in-game to hide all popups
            console.log('All popups should be hidden now - isInGame:', true);
          }}
        />
      )}
    </>
  );
};

export default Index;
