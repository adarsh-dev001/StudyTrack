
"use client";

import React, { useEffect, useRef } from 'react';

interface FocusAudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  loop?: boolean;
  volume?: number; // 0.0 to 1.0
  onEnded?: () => void;
}

const FocusAudioPlayer: React.FC<FocusAudioPlayerProps> = ({
  src,
  isPlaying,
  loop = true,
  volume = 1,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (src) {
        if (audioRef.current.src !== src) { // Only update src if it has changed
          audioRef.current.src = src;
          audioRef.current.load(); // Important to load the new source
        }
        if (isPlaying) {
          audioRef.current.play().catch(error => console.error("Error playing audio:", error));
        } else {
          audioRef.current.pause();
        }
      } else {
        audioRef.current.pause();
        audioRef.current.src = ""; // Clear src if null
      }
    }
  }, [src, isPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (onEnded && audioElement) {
      const handleEnded = () => {
        if (!loop) { // Only call onEnded if not looping, as loop handles restart
          onEnded();
        }
      };
      audioElement.addEventListener('ended', handleEnded);
      return () => {
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [onEnded, loop]);

  return <audio ref={audioRef} playsInline aria-hidden="true" />;
};

export default FocusAudioPlayer;
