
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, LogIn, Settings, ChevronDown, Play, Globe } from 'lucide-react';
import GameModeSelection from '@/components/wordquest/GameModeSelection';
import type { GameMode } from '@/components/wordquest/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For language dropdown

// Changed from React.lazy to direct import
import GameInterface from '@/components/wordquest/GameInterface';

function GameInterfaceFallback() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-10 w-1/4" /> {/* Back button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel Skeleton */}
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-12 w-1/2" /> {/* Clue/Definition Title */}
          <Skeleton className="h-24 w-full" /> {/* Clue/Definition Content */}
          <Skeleton className="h-8 w-1/3" /> {/* Picture Clue Placeholder */}
        </div>
        {/* Right Panel Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" /> {/* Timer */}
          <Skeleton className="h-10 w-full" /> {/* Score */}
          <Skeleton className="h-12 w-full" /> {/* Input Area */}
          <Skeleton className="h-10 w-full" /> {/* Hint Button */}
          <Skeleton className="h-10 w-full" /> {/* Skip Button */}
        </div>
      </div>
    </div>
  );
}


export default function WordQuestPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeGameMode, setActiveGameMode] = useState<GameMode | null>(null); // Renamed for clarity
  const [selectedModeForStart, setSelectedModeForStart] = useState<GameMode | null>(null); // For highlighting before starting
  const [gameKey, setGameKey] = useState(0); 

  const handleModeCardClick = (mode: GameMode) => {
    setSelectedModeForStart(mode); // Highlight the card
  };

  const handleStartGame = () => {
    if (selectedModeForStart) {
      setActiveGameMode(selectedModeForStart);
      setGameKey(prevKey => prevKey + 1);
    }
  };

  const handleGoBackToSelection = () => {
    setActiveGameMode(null);
    setSelectedModeForStart(null); // Also reset highlighted selection
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading WordQuest Adventure...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Card className="max-w-md w-full shadow-xl">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
                    <LogIn className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Access WordQuest</CardTitle>
                <CardDescription>Please log in or sign up to start your vocabulary adventure!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/login">Log In</Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {!activeGameMode ? (
        <>
          <div className="px-4 md:px-6">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-1">
              Quick Play
            </h1>
            <p className="text-md text-muted-foreground">
              Select a game mode <span className="inline-block transform translate-y-0.5">↓</span>
            </p>
          </div>
          <GameModeSelection 
            selectedMode={selectedModeForStart} 
            onModeSelect={handleModeCardClick} 
          />
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 sm:p-4 shadow-top-md z-10">
            <div className="container mx-auto flex items-center justify-between max-w-screen-xl px-0 sm:px-2">
              <div className="flex items-center gap-2 sm:gap-3">
                 <Select defaultValue="en">
                  <SelectTrigger className="w-auto h-9 sm:h-10 text-xs sm:text-sm pr-2">
                    <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 opacity-70" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    {/* Add other languages later */}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                  <Settings className="h-4 w-4 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" /> Settings
                </Button>
              </div>
              <Button 
                onClick={handleStartGame} 
                disabled={!selectedModeForStart}
                size="default"
                className="h-9 sm:h-10 text-xs sm:text-sm font-semibold px-4 sm:px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Play className="h-4 w-4 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Start Game
              </Button>
            </div>
          </div>
           {/* Spacer for fixed bottom bar */}
          <div className="h-16 sm:h-20"></div>
        </>
      ) : (
        <Suspense fallback={<GameInterfaceFallback />}>
          <GameInterface
            key={gameKey} 
            selectedMode={activeGameMode}
            onGoBack={handleGoBackToSelection}
          />
        </Suspense>
      )}
    </div>
  );
}
