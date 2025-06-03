
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimerIcon, PlayIcon, PauseIcon, RotateCcwIcon, Music2, VolumeX } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; 
import { useToast } from '@/hooks/use-toast';
import { ALL_SOUNDTRACK_DEFINITIONS, type SoundtrackDefinition } from '@/lib/soundtracks';
import { DEFAULT_THEME_ID } from '@/lib/themes';
import FocusAudioPlayer from '@/components/audio/FocusAudioPlayer';
import { recordPlatformInteraction } from '@/lib/activity-utils'; // Added import

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
  
  const [availableSoundtracks] = useState<SoundtrackDefinition[]>(ALL_SOUNDTRACK_DEFINITIONS);
  const [selectedSoundtrackPath, setSelectedSoundtrackPath] = useState<string | null>(null);


  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const awardCoinsForPomodoro = useCallback(async () => {
    if (!currentUser?.uid || !db) return;

    // Record interaction first
    await recordPlatformInteraction(currentUser.uid);

    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    try {
      const docSnap = await getDoc(userProfileDocRef);
      let profileData = {
        coins: 0,
        xp: 0,
        earnedBadgeIds: [],
        purchasedItemIds: [],
        activeThemeId: DEFAULT_THEME_ID,
        dailyChallengeStatus: {},
        lastInteractionDates: [],
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
  }, [currentUser, toast]); // Added currentUser and toast to dependencies

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
      if (mode === 'pomodoro') {
        if (currentUser) {
          awardCoinsForPomodoro(); // This now also records interaction
        }
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
    }
  }, [timeRemaining, mode, pomodorosCompletedCycle, isRunning, awardCoinsForPomodoro, currentUser]);

  useEffect(() => {
    setTimeRemaining(modeDurations[mode]);
    setIsRunning(false); 
  }, [mode]);


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
    <Card className="w-full max-w-sm sm:max-w-md mx-auto shadow-xl">
      <CardHeader className="text-center p-4 sm:p-6">
        <CardTitle className="font-headline text-xl sm:text-2xl flex items-center justify-center">
          <TimerIcon className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Pomodoro Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4 sm:space-y-6 p-4 sm:p-6 pt-2 sm:pt-6">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto text-xs sm:text-sm">
            <TabsTrigger value="pomodoro" className="py-1.5 sm:py-2">Pomodoro ({formatTime(POMODORO_DURATION)})</TabsTrigger>
            <TabsTrigger value="shortBreak" className="py-1.5 sm:py-2">Short Break ({formatTime(SHORT_BREAK_DURATION)})</TabsTrigger>
            <TabsTrigger value="longBreak" className="py-1.5 sm:py-2">Long Break ({formatTime(LONG_BREAK_DURATION)})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-6xl sm:text-7xl font-bold text-foreground tabular-nums my-2 sm:my-4" aria-live="polite">
          {formatTime(timeRemaining)}
        </div>

        <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-3 w-full max-w-xs">
          <Button 
            onClick={handleStartPause} 
            className="flex-1 text-md sm:text-lg py-2.5 sm:py-3 h-auto sm:h-12" 
            size="lg"
            aria-label={isRunning ? "Pause timer" : "Start timer"}
            disabled={!currentUser && mode === 'pomodoro'}
          >
            {isRunning ? <PauseIcon className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> : <PlayIcon className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button 
            onClick={handleReset} 
            variant="outline" 
            className="flex-1 text-md sm:text-lg py-2.5 sm:py-3 h-auto sm:h-12" 
            size="lg"
            aria-label="Reset timer"
          >
            <RotateCcwIcon className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
            Reset
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Completed in cycle: {pomodorosCompletedCycle % POMODOROS_UNTIL_LONG_BREAK} (next long break after {POMODOROS_UNTIL_LONG_BREAK})
        </p>
         {!currentUser && mode === 'pomodoro' && (
            <p className="text-xs text-destructive text-center mt-1 sm:mt-2">Login to track Pomodoros and earn rewards!</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 sm:space-y-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t">
        {true && (
            <div className="w-full max-w-xs">
                <Select 
                    onValueChange={handleSoundtrackChange} 
                    defaultValue={selectedSoundtrackPath ? availableSoundtracks.find(s => s.filePath === selectedSoundtrackPath)?.id : "none"}
                    disabled={availableSoundtracks.length === 0}
                >
                    <SelectTrigger className="w-full text-xs sm:text-sm h-9 sm:h-10">
                        <SelectValue placeholder="Select Soundtrack..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="text-xs sm:text-sm">
                            <div className="flex items-center">
                                <VolumeX className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> No Sound
                            </div>
                        </SelectItem>
                        {availableSoundtracks.map(track => (
                            <SelectItem key={track.id} value={track.id} className="text-xs sm:text-sm">
                                <div className="flex items-center">
                                    <Music2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {track.name}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {availableSoundtracks.length === 0 && <p className="text-xs text-muted-foreground text-center mt-1">No soundtracks available.</p>}
            </div>
        )}
        <FocusAudioPlayer src={selectedSoundtrackPath} isPlaying={isRunning && !!selectedSoundtrackPath} loop={true} volume={0.5} />
      </CardFooter>
    </Card>
  );
}

