
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Swords, LogIn } from 'lucide-react';
import GameModeSelection from '@/components/wordquest/GameModeSelection';
import type { GameMode } from '@/components/wordquest/types'; // Ensure this path is correct
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const GameInterface = React.lazy(() => import('@/components/wordquest/GameInterface'));

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
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [gameKey, setGameKey] = useState(0); // To reset GameInterface state on mode change

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    setGameKey(prevKey => prevKey + 1); // Force re-mount of GameInterface
  };

  const handleGoBackToSelection = () => {
    setSelectedMode(null);
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
      {!selectedMode ? (
        <>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center justify-center">
              <Swords className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> WordQuest – Vocabulary Adventure
            </h1>
            <p className="text-md sm:text-lg text-muted-foreground mt-1">
              Choose your challenge and expand your English vocabulary!
            </p>
          </div>
          <GameModeSelection onModeSelect={handleModeSelect} />
        </>
      ) : (
        <Suspense fallback={<GameInterfaceFallback />}>
          <GameInterface
            key={gameKey} // Use key to force re-mount and reset state
            selectedMode={selectedMode}
            onGoBack={handleGoBackToSelection}
          />
        </Suspense>
      )}
    </div>
  );
}
