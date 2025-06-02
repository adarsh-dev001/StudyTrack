
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimerIcon, PlayIcon, PauseIcon, RotateCcwIcon, Music2, VolumeX } from 'lucide-react'; // Removed Volume2 as player handles it
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'; // Removed Timestamp as it's not directly used here for new features
import { useToast } from '@/hooks/use-toast';
import { ALL_SOUNDTRACK_DEFINITIONS, type SoundtrackDefinition } from '@/lib/soundtracks';
import { DEFAULT_THEME_ID } from '@/lib/themes';
import FocusAudioPlayer from '@/components/audio/FocusAudioPlayer'; // Import the new player

const POMODORO_DURATION = 25 * 60; 
const SHORT_BREAK_DURATION = 5 * 60; 
const LONG_BREAK_DURATION = 15 * 60;
const POMODOROS_UNTIL_LONG_BREAK = 4;
const COINS_FOR_POMODORO = 5;

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

const modeDurations: Record<Mode, number> = {
  pomodoro: POMODORO_DURATION,
  shortBreak: SHORT_BREAK_DURATION,
  longBreak: LONG_BREAK_DURATION,
};

export function PomodoroTimer() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [timeRemaining, setTimeRemaining] = useState(modeDurations[mode]);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompletedCycle, setPomodorosCompletedCycle] = useState(0);
  
  const [purchasedSoundtrackIds, setPurchasedSoundtrackIds] = useState<string[]>([]);
  const [availableSoundtracks, setAvailableSoundtracks] = useState<SoundtrackDefinition[]>([]);
  const [selectedSoundtrackPath, setSelectedSoundtrackPath] = useState<string | null>(null);
  // audioRef is no longer needed here, FocusAudioPlayer manages its own audio element.

  useEffect(() => {
    if (!currentUser?.uid || !db) {
        setPurchasedSoundtrackIds([]);
        setAvailableSoundtracks([]);
        return;
    }
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    const unsubscribe = onSnapshot(userProfileDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const ids = data.purchasedItemIds || [];
            setPurchasedSoundtrackIds(ids);
            
            const userTracks = ALL_SOUNDTRACK_DEFINITIONS.filter(track => ids.includes(track.id));
            setAvailableSoundtracks(userTracks);
        } else {
            setPurchasedSoundtrackIds([]);
            setAvailableSoundtracks([]);
        }
    }, (error) => {
        console.error("Error fetching purchased soundtracks:", error);
        setPurchasedSoundtrackIds([]);
        setAvailableSoundtracks([]);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);


  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const awardCoinsForPomodoro = async () => {
    if (!currentUser?.uid || !db) return;

    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    try {
      const docSnap = await getDoc(userProfileDocRef);
      let profileData = {
        coins: 0,
        xp: 0,
        earnedBadgeIds: [],
        purchasedItemIds: purchasedSoundtrackIds, 
        activeThemeId: DEFAULT_THEME_ID,
        dailyChallengeStatus: {}
      };

      if (docSnap.exists()) {
        profileData = { ...profileData, ...docSnap.data() };
      }
      
      const newCoins = profileData.coins + COINS_FOR_POMODORO;
      const updatePayload = { ...profileData, coins: newCoins };

      if (docSnap.exists()) {
        await updateDoc(userProfileDocRef, updatePayload);
      } else {
        await setDoc(userProfileDocRef, updatePayload);
      }

      toast({
        title: 'Pomodoro Complete! 🎉',
        description: `✨ +${COINS_FOR_POMODORO} Coins for completing a focus session! Keep it up!`,
      });
    } catch (error) {
      console.error("Error awarding coins for Pomodoro:", error);
      toast({
        title: 'Coin Award Error',
        description: 'Could not update your coin balance for the Pomodoro session.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && isRunning) {
      // setIsRunning(false); // Keep isRunning true to allow audio to play for the new mode until user pauses or resets.
                              // Or, if sound should stop immediately, then set isRunning to false.
                              // For now, sound will stop because isRunning changes below.
      
      if (mode === 'pomodoro') {
        awardCoinsForPomodoro();
        const newPomodorosCompleted = pomodorosCompletedCycle + 1;
        setPomodorosCompletedCycle(newPomodorosCompleted);
        if (newPomodorosCompleted % POMODOROS_UNTIL_LONG_BREAK === 0) {
          setMode('longBreak');
        } else {
          setMode('shortBreak');
        }
      } else { 
        setMode('pomodoro');
      }
      // isRunning will be set to false in the mode change effect if we want audio to stop on mode auto-switch
    }
  }, [timeRemaining, mode, pomodorosCompletedCycle, isRunning, awardCoinsForPomodoro]); // awardCoinsForPomodoro added to dependencies

  useEffect(() => {
    setTimeRemaining(modeDurations[mode]);
    setIsRunning(false); // Stop timer and audio when mode changes
  }, [mode]);

  // No longer need useEffect for direct audioRef manipulation, FocusAudioPlayer handles it.

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(modeDurations[mode]);
  }, [mode]);

  const handleModeChange = (newModeString: string) => {
    const newMode = newModeString as Mode;
    setMode(newMode);
    // isRunning and timeRemaining are reset by the mode effect
  };
  
  const handleSoundtrackChange = (soundtrackId: string) => {
    if (soundtrackId === "none") {
      setSelectedSoundtrackPath(null);
    } else {
      const track = ALL_SOUNDTRACK_DEFINITIONS.find(t => t.id === soundtrackId);
      if (track) {
        setSelectedSoundtrackPath(track.filePath);
      }
    }
  };

  useEffect(() => {
    const baseTitle = "StudyTrack";
    if (isRunning) {
      document.title = `${formatTime(timeRemaining)} - ${mode.charAt(0).toUpperCase() + mode.slice(1).replace('B', ' B')} - ${baseTitle}`;
    } else if (timeRemaining === 0 && mode === 'pomodoro' && !isRunning) {
        document.title = `Break Time! - ${baseTitle}`;
    } else if (timeRemaining === 0 && (mode === 'shortBreak' || mode === 'longBreak') && !isRunning) {
        document.title = `Back to Study! - ${baseTitle}`;
    } else {
      document.title = `Pomodoro Timer - ${baseTitle}`;
    }
    return () => {
      document.title = baseTitle; 
    };
  }, [timeRemaining, isRunning, mode]);

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl flex items-center justify-center">
          <TimerIcon className="mr-2 h-7 w-7 text-primary" />
          Pomodoro Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 pt-6">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pomodoro">Pomodoro ({formatTime(POMODORO_DURATION)})</TabsTrigger>
            <TabsTrigger value="shortBreak">Short Break ({formatTime(SHORT_BREAK_DURATION)})</TabsTrigger>
            <TabsTrigger value="longBreak">Long Break ({formatTime(LONG_BREAK_DURATION)})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-7xl font-bold text-foreground tabular-nums my-4" aria-live="polite">
          {formatTime(timeRemaining)}
        </div>

        <div className="flex space-x-4">
          <Button 
            onClick={handleStartPause} 
            className="w-32 text-lg py-6" 
            size="lg"
            aria-label={isRunning ? "Pause timer" : "Start timer"}
            disabled={!currentUser}
          >
            {isRunning ? <PauseIcon className="mr-2" /> : <PlayIcon className="mr-2" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button 
            onClick={handleReset} 
            variant="outline" 
            className="w-32 text-lg py-6" 
            size="lg"
            aria-label="Reset timer"
          >
            <RotateCcwIcon className="mr-2" />
            Reset
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Completed in cycle: {pomodorosCompletedCycle % POMODOROS_UNTIL_LONG_BREAK} (next long break after {POMODOROS_UNTIL_LONG_BREAK})
        </p>
         {!currentUser && (
            <p className="text-xs text-destructive text-center mt-2">Login to track Pomodoros and earn rewards!</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-3 pt-4 border-t">
        {currentUser && (
            <div className="w-full max-w-xs">
                <Select 
                    onValueChange={handleSoundtrackChange} 
                    defaultValue={selectedSoundtrackPath ? availableSoundtracks.find(s => s.filePath === selectedSoundtrackPath)?.id : "none"}
                    disabled={availableSoundtracks.length === 0}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Soundtrack..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">
                            <div className="flex items-center">
                                <VolumeX className="mr-2 h-4 w-4" /> No Sound
                            </div>
                        </SelectItem>
                        {availableSoundtracks.map(track => (
                            <SelectItem key={track.id} value={track.id}>
                                <div className="flex items-center">
                                    <Music2 className="mr-2 h-4 w-4" /> {track.name}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {availableSoundtracks.length === 0 && <p className="text-xs text-muted-foreground text-center mt-1.5">Purchase soundtracks in the Shop!</p>}
            </div>
        )}
        <FocusAudioPlayer src={selectedSoundtrackPath} isPlaying={isRunning && !!selectedSoundtrackPath} loop={true} volume={0.5} />
         {/* USER ACTION REQUIRED: 
             The 'filePath' in src/lib/soundtracks.ts currently uses placeholders like '/sounds/placeholder_lofi_1.mp3'.
             You need to:
             1. Create a 'sounds' folder inside your 'public' directory.
             2. Place your actual audio files (e.g., lofi_chill_1.mp3) in 'public/sounds/'.
             3. Update the 'filePath' in 'src/lib/soundtracks.ts' to reflect the correct paths to your audio files.
             For example, change '/sounds/placeholder_lofi_1.mp3' to '/sounds/your_actual_lofi_filename.mp3'.
        */}
      </CardFooter>
    </Card>
  );
}
