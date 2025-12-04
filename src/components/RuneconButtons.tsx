import React, { useState } from 'react';

interface RuneconButtonsProps {
  onRuneconClick?: (runeconNumber: number) => void;
}

const RuneconButtons: React.FC<RuneconButtonsProps> = ({ onRuneconClick }) => {
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);

  const handleClick = (runeconNumber: number) => {
    console.log(`Runecon ${runeconNumber} clicked`);
    if (onRuneconClick) {
      onRuneconClick(runeconNumber);
    }
  };

  const buttonStyle = (index: number, runeconNumber: number) => ({
    width: '48px',
    height: '48px',
    backgroundImage: `url(/runecons/runecon${runeconNumber}.png)`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    border: 'none',
    padding: '0',
    margin: '0',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
    transform: hoveredButton === index ? 'scale(1.1)' : 'scale(1)',
    filter: hoveredButton === index ? 'brightness(1.2)' : 'brightness(1)',
    display: 'inline-block',
    verticalAlign: 'top',
    imageRendering: 'pixelated',
  });

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    imageRendering: 'pixelated' as const,
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        right: '45px', // Offset to avoid skills panel with smaller gap
        zIndex: 1000,
        height: '48px',
        width: '624px', // 48px * 13 buttons
        fontSize: '0', // Remove whitespace between inline-block elements
        lineHeight: '0',
      }}
    >
      {Array.from({ length: 13 }, (_, i) => i + 1).map((runeconNumber) => (
        <button
          key={runeconNumber}
          style={buttonStyle(runeconNumber, runeconNumber)}
          onClick={() => handleClick(runeconNumber)}
          onMouseEnter={() => setHoveredButton(runeconNumber)}
          onMouseLeave={() => setHoveredButton(null)}
          title={`Runecon ${runeconNumber}`}
        />
      ))}
    </div>
  );
};

export default RuneconButtons;