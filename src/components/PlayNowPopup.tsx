import { useState, useEffect } from "react";
import LoginScreenRunes from "./LoginScreenRunes";
import BackgroundSelect from "./BackgroundSelect";

interface PlayNowPopupProps {
  onClose: () => void;
  onLogin: () => void;
  onCreatePenguin: () => void;
}

const PlayNowPopup = ({ onClose, onLogin, onCreatePenguin }: PlayNowPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasExistingCharacter, setHasExistingCharacter] = useState(false);
  const [currentBackground, setCurrentBackground] = useState("/backgrounds/default.jpg");

  useEffect(() => {
    // Add a small delay for smooth animation
    setTimeout(() => setIsVisible(true), 10);
    
    // Check if user has existing character
    const characterData = localStorage.getItem('characterData');
    if (characterData) {
      setHasExistingCharacter(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handlePlayNow = () => {
    // Always go to login screen when Play Now is clicked
    onLogin();
  };

  return (
    <>
      <style>{`
        @keyframes pulseScale {
          0%, 100% {
            transform: scale(1) translateZ(0);
          }
          50% {
            transform: scale(1.15) translateZ(50px);
          }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div 
        className={`fixed top-0 left-0 w-screen h-screen overflow-hidden ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ 
          backgroundColor: "#000000",
          backgroundImage: `url(${currentBackground})`,
          backgroundSize: "1148px 755px",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "opacity 300ms ease-in-out",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          minHeight: "100vh",
          zIndex: 9999
        }}
      >
        {/* Fire rune effects from OSRS */}
        <LoginScreenRunes />
        
        {/* Background selector */}
        <BackgroundSelect 
          onBackgroundChange={setCurrentBackground}
          currentBackground={currentBackground}
        />
        
        {/* Twitter button at the top */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10
        }}>
          <a 
            href="https://x.com/runescapewtf" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "2px solid #ffb366",
              borderRadius: "8px",
              color: "#ffb366",
              textDecoration: "none",
              fontSize: "18px",
              fontWeight: "bold",
              fontFamily: "'Bungee', cursive",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 20px rgba(255, 179, 102, 0.3)",
              textShadow: "0 0 10px rgba(255, 179, 102, 0.5)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#ffb366";
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.transform = "translateX(-50%) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 6px 30px rgba(255, 179, 102, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              e.currentTarget.style.color = "#ffb366";
              e.currentTarget.style.transform = "translateX(-50%) scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(255, 179, 102, 0.3)";
            }}
          >
            <span style={{ fontSize: "20px" }}>🐦</span>
            Follow @runescapewtf
          </a>
        </div>
        
        {/* Torch/flame effects for ambiance */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "60px",
          height: "60px",
          background: "radial-gradient(circle, rgba(255,140,0,0.3) 0%, transparent 70%)",
          filter: "blur(20px)",
          animation: "flicker 3s ease-in-out infinite"
        }}></div>
        <div style={{
          position: "absolute",
          top: "15%",
          right: "8%",
          width: "50px",
          height: "50px",
          background: "radial-gradient(circle, rgba(255,165,0,0.25) 0%, transparent 70%)",
          filter: "blur(15px)",
          animation: "flicker 4s ease-in-out infinite 1s"
        }}></div>
        <div style={{
          position: "absolute",
          bottom: "20%",
          left: "10%",
          width: "40px",
          height: "40px",
          background: "radial-gradient(circle, rgba(255,140,0,0.2) 0%, transparent 70%)",
          filter: "blur(18px)",
          animation: "flicker 3.5s ease-in-out infinite 0.5s"
        }}></div>

        {/* Main content container - centered */}
        <div 
          className="flex flex-col items-center justify-center h-full"
          style={{ 
            position: "relative",
            zIndex: 1
          }}
        >
          {/* Logo prominently displayed at top with pulsing animation */}
          <div 
            style={{
              textAlign: "center",
              marginBottom: "30px",
              marginTop: "60px",
              perspective: "1000px"
            }}
          >
            <img 
              src="/logo.webp" 
              alt="RuneScape"
              className="animate-pulse-3d"
              style={{ 
                width: "auto",
                height: "180px",
                imageRendering: "crisp-edges",
                filter: "drop-shadow(0 0 20px rgba(255,204,51,0.6)) drop-shadow(0 0 40px rgba(255,204,51,0.3))",
                animation: "pulseScale 2s ease-in-out infinite"
              }}
            />
          </div>

          {/* New container with play now button */}
          <div 
            style={{ 
              position: "relative",
              width: "600px",
              height: "300px",
              backgroundImage: "url('/login-container.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {/* Play Now button - larger and positioned to match container */}
            <div
              onClick={handlePlayNow}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "540px",
                height: "135px",
                backgroundImage: "url('/playnow-button.png')",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                cursor: "pointer",
                transition: "transform 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(0.95)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
              }}
            />
            
            {/* Create new character link - positioned below the button */}
            <div
              onClick={onCreatePenguin}
              style={{
                position: "absolute",
                bottom: "23px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "#ffcc00",
                fontSize: "20px",
                fontFamily: "Arial, sans-serif",
                textDecoration: "underline",
                cursor: "pointer",
                textShadow: "1px 1px 2px #000",
                transition: "color 0.2s ease",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#ffcc00";
              }}
            >
              CREATE NEW CHARACTER
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default PlayNowPopup;
