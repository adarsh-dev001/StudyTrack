
'use client';

import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const PomodoroTimer = React.lazy(() => import('@/components/pomodoro/pomodoro-timer').then(module => ({ default: module.PomodoroTimer })));

function PomodoroFallback() {
  return (
    <div className="w-full max-w-md mx-auto shadow-xl rounded-lg border bg-card">
        <div className="text-center p-6">
            <Skeleton className="h-8 w-1/2 mx-auto mb-6" />
        </div>
        <div className="flex flex-col items-center space-y-6 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-48 rounded-md" />
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full">
                <Skeleton className="h-12 w-full sm:w-32 rounded-md" />
                <Skeleton className="h-12 w-full sm:w-32 rounded-md" />
            </div>
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
  );
}

export default function PomodoroPage() {
  return (
    <div className="w-full space-y-6 flex flex-col items-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Pomodoro Timer</h1>
        <p className="text-lg text-muted-foreground">Boost your focus with the Pomodoro technique.</p>
      </div>
      <Suspense fallback={<PomodoroFallback />}>
        <PomodoroTimer />
      </Suspense>
    </div>
  );
}
