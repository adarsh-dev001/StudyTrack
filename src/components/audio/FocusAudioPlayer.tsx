
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusAudioPlayerProps {
  src: string | null; // Allow null for controlled mode if no track is selected
  loop?: boolean;
  volume?: number; // 0.0 to 1.0
  
  // For controlled mode (e.g., Pomodoro timer)
  isPlaying?: boolean; // If provided, component is in controlled mode
  onEnded?: () => void;

  // For UI mode (used if isPlaying is NOT provided)
  label?: string; // If provided and isPlaying is not, component is in UI mode
  autoPlay?: boolean; // Effective only in UI mode
  className?: string;
}

const FocusAudioPlayer: React.FC<FocusAudioPlayerProps> = ({
  src,
  loop = true, // Default to true, can be overridden (e.g., loop=false for UI snippets)
  volume = 0.7,
  isPlaying: controlledIsPlaying, // Prop for external control
  onEnded,
  label,
  autoPlay = false,
  className,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const isControlledMode = controlledIsPlaying !== undefined;
  const isUIMode = !isControlledMode && !!label;

  // Internal playing state for UI mode
  const [selfManagedIsPlaying, setSelfManagedIsPlaying] = useState(isUIMode && autoPlay && !!src);

  // Determine the actual playing state based on mode
  const actualIsPlaying = isControlledMode ? controlledIsPlaying : selfManagedIsPlaying;

  // Set loop and volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  // Handle src changes
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (src === null || audioElement.src !== src) {
        audioElement.src = src || ""; // Set to empty string if null to stop current playback
        if (src) {
          audioElement.load(); // Load the new source
          // If it should be playing (either due to autoplay in UI mode or controlled state)
          if (actualIsPlaying) {
            audioElement.play().catch(e => console.error("Error playing new src:", e));
          }
        } else {
          audioElement.pause(); // Explicitly pause if src is null
        }
      }
    }
  }, [src, actualIsPlaying]); // actualIsPlaying is needed here to resume if src changes while playing

  // Control play/pause based on actualIsPlaying state
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (actualIsPlaying && audioElement.src && !audioElement.src.endsWith('null')) { // Ensure src is valid
        audioElement.play().catch(e => console.error("Error playing audio:", e));
      } else {
        audioElement.pause();
      }
    }
  }, [actualIsPlaying, src]); // Also depend on src to re-evaluate when src changes

  // Handle 'ended' event
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleAudioEnded = () => {
        if (isUIMode && !loop) {
          setSelfManagedIsPlaying(false); // Stop playback in UI mode if not looping
        }
        if (onEnded && !loop) { // Call onEnded for controlled mode if not looping
            onEnded();
        }
        // If looping, the browser handles it automatically.
      };
      audioElement.addEventListener('ended', handleAudioEnded);
      return () => {
        audioElement.removeEventListener('ended', handleAudioEnded);
      };
    }
  }, [loop, onEnded, isUIMode]);

  const togglePlayPauseForUI = () => {
    if (isUIMode) {
      setSelfManagedIsPlaying(prev => !prev);
    }
  };

  if (isUIMode) {
    return (
      <div className={cn("flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm", className)}>
        <span className="text-sm font-medium text-card-foreground mr-2 truncate" title={label}>{label}</span>
        <Button 
          onClick={togglePlayPauseForUI} 
          variant="ghost" 
          size="icon" 
          aria-label={actualIsPlaying ? 'Pause' : 'Play'}
          disabled={!src} // Disable button if no src
        >
          {actualIsPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
        </Button>
        {/* Audio element is hidden but controlled by state */}
        <audio ref={audioRef} playsInline aria-hidden="true" />
      </div>
    );
  }

  // Invisible player for controlled mode (e.g., Pomodoro Timer)
  // src is set by useEffect
  return <audio ref={audioRef} playsInline aria-hidden="true" />;
};

export default FocusAudioPlayer;
    