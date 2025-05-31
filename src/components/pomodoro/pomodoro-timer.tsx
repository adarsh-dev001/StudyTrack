
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimerIcon, PlayIcon, PauseIcon, RotateCcwIcon } from 'lucide-react';

const POMODORO_DURATION = 25 * 60; // 25 minutes
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes
const POMODOROS_UNTIL_LONG_BREAK = 4;

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

const modeDurations: Record<Mode, number> = {
  pomodoro: POMODORO_DURATION,
  shortBreak: SHORT_BREAK_DURATION,
  longBreak: LONG_BREAK_DURATION,
};

export function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [timeRemaining, setTimeRemaining] = useState(modeDurations[mode]);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompletedCycle, setPomodorosCompletedCycle] = useState(0);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Effect for countdown
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

  // Effect to handle timer completion and automatic mode switching
  useEffect(() => {
    if (timeRemaining === 0) {
      setIsRunning(false); // Stop the timer visually
      // Optional: Play a sound here if you add one later
      // e.g., new Audio('/sounds/notification.mp3').play();

      if (mode === 'pomodoro') {
        const newPomodorosCompleted = pomodorosCompletedCycle + 1;
        setPomodorosCompletedCycle(newPomodorosCompleted);
        if (newPomodorosCompleted % POMODOROS_UNTIL_LONG_BREAK === 0) {
          setMode('longBreak');
        } else {
          setMode('shortBreak');
        }
      } else { // shortBreak or longBreak ended
        setMode('pomodoro');
      }
    }
  }, [timeRemaining, mode, pomodorosCompletedCycle]); // Dependencies are important here

  // Effect to update timeRemaining and stop timer when mode changes
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
    // If you want reset to also reset the cycle count:
    // setPomodorosCompletedCycle(0); 
  }, [mode]);

  const handleModeChange = (newModeString: string) => {
    const newMode = newModeString as Mode;
    setMode(newMode);
  };
  
  // Update document title with time remaining
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
    // Cleanup function to reset title
    return () => {
      document.title = baseTitle; 
    };
  }, [timeRemaining, isRunning, mode]);

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
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
      </CardContent>
    </Card>
  );
}
