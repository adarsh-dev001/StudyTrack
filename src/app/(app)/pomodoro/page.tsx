
'use client';

import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const PomodoroTimer = React.lazy(() => import('@/components/pomodoro/pomodoro-timer').then(module => ({ default: module.PomodoroTimer })));

function PomodoroFallback() {
  return (
    <div className="w-full shadow-xl rounded-lg border bg-card">
        <div className="text-center p-6">
            <Skeleton className="h-8 w-1/2 mx-auto mb-6" />
        </div>
        <div className="flex flex-col items-center space-y-6 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-48 rounded-md" />
            <div className="flex space-x-4">
                <Skeleton className="h-12 w-32 rounded-md" />
                <Skeleton className="h-12 w-32 rounded-md" />
            </div>
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
  );
}

export default function PomodoroPage() {
  return (
    <div className="w-full space-y-6">
      <div className="p-0 m-0">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Pomodoro Timer</h1>
        <p className="text-lg text-muted-foreground">Boost your focus with the Pomodoro technique.</p>
      </div>
      <Suspense fallback={<PomodoroFallback />}>
        <PomodoroTimer />
      </Suspense>
    </div>
  );
}
