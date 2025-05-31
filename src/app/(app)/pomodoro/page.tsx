
'use client';

import { PomodoroTimer } from '@/components/pomodoro/pomodoro-timer';

export default function PomodoroPage() {
  return (
    <div className="w-full space-y-6">
      <div className="p-0 m-0">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Pomodoro Timer</h1>
        <p className="text-lg text-muted-foreground">Boost your focus with the Pomodoro technique.</p>
      </div>
      <PomodoroTimer />
    </div>
  );
}
