
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface FocusAudioPlayerProps {
  src: string | null;
  loop?: boolean;
  volume?: number;

  isPlaying?: boolean;
  onEnded?: () => void;

  label?: string;
  autoPlay?: boolean;
  className?: string;
}

const FocusAudioPlayerComponent: React.FC<FocusAudioPlayerProps> = ({
  src,
  loop = true,
  volume = 0.7,
  isPlaying: controlledIsPlaying,
  onEnded,
  label,
  autoPlay = false,
  className,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const isControlledMode = controlledIsPlaying !== undefined;
  const isUIMode = !isControlledMode && !!label;

  const [selfManagedIsPlaying, setSelfManagedIsPlaying] = useState(isUIMode && autoPlay && !!src);
  const [uiVolume, setUiVolume] = useState<number>(volume);

  const actualIsPlaying = isControlledMode ? controlledIsPlaying : selfManagedIsPlaying;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (isControlledMode) {
        audioElement.volume = Math.max(0, Math.min(1, volume));
      } else {
        audioElement.volume = Math.max(0, Math.min(1, uiVolume));
      }
    }
  }, [volume, uiVolume, isControlledMode]);

  // Effect to handle source changes
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    // If src is explicitly null or if the current src is different from the new src prop
    if (src === null || (audioElement.src && src && audioElement.src !== new URL(src, window.location.origin).href)) {
      const newSrc = src ? new URL(src, window.location.origin).href : "";
      audioElement.src = newSrc;
      
      if (newSrc) {
        audioElement.load(); // Load the new source
        if (actualIsPlaying) {
          // Attempt to play if it should be playing according to the current state
          audioElement.play().catch(e => console.error("Error playing new src:", e));
        }
      } else {
        audioElement.pause(); // If src is null or empty, ensure it's paused
      }
    }
  }, [src, actualIsPlaying]); // Added actualIsPlaying to dependencies

  // Effect to handle play/pause based on actualIsPlaying state
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (actualIsPlaying && audioElement.src && src) { // Ensure src is not null before playing
      audioElement.play().catch(e => console.error("Error playing audio:", e));
    } else {
      audioElement.pause();
    }
  }, [actualIsPlaying, src]); // Depends on `actualIsPlaying` and `src` to ensure valid source


  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleAudioEnded = () => {
        if (isUIMode && !loop) {
          setSelfManagedIsPlaying(false);
        }
        if (onEnded && !loop) {
            onEnded();
        }
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

  const handleVolumeChangeForUI = (newVolume: number[]) => {
    if (isUIMode) {
      setUiVolume(newVolume[0]);
    }
  };

  if (isUIMode) {
    return (
      <div className={cn("flex flex-col space-y-2 p-3 border rounded-lg bg-card shadow-sm", className)}>
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-card-foreground mr-2 truncate" title={label}>{label}</span>
            <Button
            onClick={togglePlayPauseForUI}
            variant="ghost"
            size="icon"
            aria-label={actualIsPlaying ? 'Pause' : 'Play'}
            disabled={!src}
            >
            {actualIsPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
            </Button>
        </div>
        <div className="flex items-center space-x-2">
            {uiVolume > 0 ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            <Slider
                defaultValue={[uiVolume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChangeForUI}
                className="w-full"
                aria-label="Volume"
                disabled={!src}
            />
        </div>
        <audio ref={audioRef} playsInline preload="auto" aria-hidden="true" />
      </div>
    );
  }

  return <audio ref={audioRef} playsInline preload="auto" aria-hidden="true" />;
};

export default React.memo(FocusAudioPlayerComponent);
