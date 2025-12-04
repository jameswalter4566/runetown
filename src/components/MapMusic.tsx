import React, { useEffect, useRef } from 'react';

type MapArea = 'town' | 'stadium' | 'plaza' | 'forest' | 'cove' | 'mineshack' | 'coffeeshop' | 'nightclub' | 'giftshop' | 'dock' | 'forts';

interface MapMusicProps {
  currentMap: MapArea;
  volume?: number;
}

// Map music configuration
const MAP_MUSIC: Record<MapArea, string | null> = {
  town: '/town-theme.mp3',
  coffeeshop: '/coffeeshop-theme.mp3',
  nightclub: '/nightclub-theme.mp3',
  giftshop: '/giftshop-theme.mp3',
  stadium: null,
  plaza: null,
  forest: null,
  cove: null,
  mineshack: null,
  dock: null,
  forts: null
};

export const MapMusic: React.FC<MapMusicProps> = ({ currentMap, volume = 0.3 }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<string | null>(null);

  useEffect(() => {
    const musicFile = MAP_MUSIC[currentMap];
    
    // If no music for this map, stop any playing music
    if (!musicFile) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      currentTrackRef.current = null;
      return;
    }

    // If same track is already playing, don't restart it
    if (currentTrackRef.current === musicFile && audioRef.current && !audioRef.current.paused) {
      return;
    }

    // Stop current music if different track
    if (audioRef.current && currentTrackRef.current !== musicFile) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Create new audio element for the new track
    const audio = new Audio(musicFile);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = 'auto';

    // Handle audio loading and playback
    const handleCanPlayThrough = () => {
      audio.play().catch(error => {
        console.log('Audio autoplay blocked, user interaction required:', error);
      });
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    
    // Handle audio errors
    audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
    });

    audioRef.current = audio;
    currentTrackRef.current = musicFile;

    // Cleanup function
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [currentMap, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return null; // This component doesn't render anything visible
};