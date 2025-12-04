import { useState } from "react";

const backgrounds = [
  { name: "Default", path: "/backgrounds/default.jpg" },
  { name: "Christmas", path: "/backgrounds/christmas.jpg" },
  { name: "Halloween", path: "/backgrounds/halloween.jpg" },
  { name: "Halloween 2", path: "/backgrounds/halloween2.jpg" },
  { name: "Hunter", path: "/backgrounds/hunter.jpg" },
  { name: "Inferno", path: "/backgrounds/inferno.jpg" },
  { name: "Kebos Lowlands", path: "/backgrounds/kebosLowlands.jpg" },
  { name: "Nex", path: "/backgrounds/nex.jpg" },
  { name: "Song of the Elves", path: "/backgrounds/songOfTheElves.jpg" },
  { name: "Theatre of Blood", path: "/backgrounds/theatreOfBlood.jpg" },
  { name: "Tombs of Amascut", path: "/backgrounds/tombsOfAmascut.jpg" },
  { name: "A Kingdom Divided", path: "/backgrounds/aKingdomDivided.jpg" },
  { name: "Chambers of Xeric", path: "/backgrounds/chambersOfXeric.jpg" },
  { name: "Dragon Slayer II", path: "/backgrounds/dragonSlayerII.jpg" },
  { name: "Fossil Island", path: "/backgrounds/fossilIsland.jpg" },
  { name: "Monkey Madness II", path: "/backgrounds/monkeyMadnessII.jpg" },
  { name: "Shattered Relics League", path: "/backgrounds/shatteredRelicsLeague.jpg" },
  { name: "Sins of the Father", path: "/backgrounds/sinsOfTheFather.jpg" },
];

interface BackgroundSelectProps {
  onBackgroundChange: (backgroundPath: string) => void;
  currentBackground: string;
}

const BackgroundSelect = ({ onBackgroundChange, currentBackground }: BackgroundSelectProps) => {
  const currentIndex = backgrounds.findIndex(bg => bg.path === currentBackground);
  const [selectedIndex, setSelectedIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

  const handlePrevious = () => {
    const newIndex = selectedIndex === 0 ? backgrounds.length - 1 : selectedIndex - 1;
    setSelectedIndex(newIndex);
    onBackgroundChange(backgrounds[newIndex].path);
  };

  const handleNext = () => {
    const newIndex = selectedIndex === backgrounds.length - 1 ? 0 : selectedIndex + 1;
    setSelectedIndex(newIndex);
    onBackgroundChange(backgrounds[newIndex].path);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "1148px",
        height: "755px",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Arrow container positioned in top right of background */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "15px",
          pointerEvents: "auto",
        }}
      >
        {/* Next arrow (on left) */}
        <button
          onClick={handleNext}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
            opacity: 1,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <img
            src="/arrow.png"
            alt="Next"
            style={{
              width: "30px",
              height: "30px",
              filter: "brightness(0) invert(1) drop-shadow(2px 2px 4px rgba(0,0,0,0.8))",
            }}
          />
        </button>

        {/* Previous arrow (on right) */}
        <button
          onClick={handlePrevious}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
            opacity: 1,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <img
            src="/arrow.png"
            alt="Previous"
            style={{
              width: "30px",
              height: "30px",
              transform: "rotate(180deg)",
              filter: "brightness(0) invert(1) drop-shadow(2px 2px 4px rgba(0,0,0,0.8))",
            }}
          />
        </button>
      </div>
    </div>
  );
};

export default BackgroundSelect;