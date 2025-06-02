
'use client';

import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const PomodoroTimer = React.lazy(() => import('@/components/pomodoro/pomodoro-timer').then(module => ({ default: module.PomodoroTimer })));

function PomodoroFallback() {
  return (
    <div className="w-full max-w-md mx-auto shadow-xl rounded-lg border bg-card p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
            <Skeleton className="h-7 sm:h-8 w-3/4 sm:w-1/2 mx-auto" />
        </div>
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <Skeleton className="h-8 sm:h-10 w-full" /> {/* Tabs */}
            <Skeleton className="h-16 sm:h-20 w-40 sm:w-48 rounded-md" /> {/* Time Display */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full">
                <Skeleton className="h-10 sm:h-12 w-full rounded-md" /> {/* Start/Pause Button */}
                <Skeleton className="h-10 sm:h-12 w-full rounded-md" /> {/* Reset Button */}
            </div>
            <Skeleton className="h-3 sm:h-4 w-3/4" /> {/* Cycle count */}
            <Skeleton className="h-10 w-full mt-4" /> {/* Soundtrack Select */}
        </div>
    </div>
  );
}

export default function PomodoroPage() {
  return (
    <div className="w-full space-y-4 sm:space-y-6 flex flex-col items-center p-4">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">Pomodoro Timer</h1>
        <p className="text-md sm:text-lg text-muted-foreground">Boost your focus with the Pomodoro technique.</p>
      </div>
      <Suspense fallback={<PomodoroFallback />}>
        <PomodoroTimer />
      </Suspense>
    </div>
  );
}
