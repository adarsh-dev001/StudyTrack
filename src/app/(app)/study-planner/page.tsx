
'use client';

import React, { useState, Suspense } from 'react';
import { PlannerHeader } from '@/components/planner/planner-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const PlannerView = React.lazy(() => import('@/components/planner/planner-view').then(module => ({ default: module.PlannerView })));
const DayView = React.lazy(() => import('@/components/planner/day-view').then(module => ({ default: module.DayView })));

const ALL_SUBJECTS_FILTER_VALUE = "all";

function PlannerViewFallback() {
  return (
    <div className="flex-grow overflow-hidden p-4 border rounded-lg shadow flex flex-col items-center justify-center min-h-[400px] bg-card">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading Study Planner...</p>
      <div className="w-full mt-6 space-y-3">
        <Skeleton className="h-10 w-full opacity-50" />
        <div className="grid grid-cols-7 gap-2">
            {Array.from({length: 7}).map((_, i) => <Skeleton key={i} className="h-64 w-full opacity-30" />)}
        </div>
      </div>
    </div>
  );
}

function DayViewFallback() {
  return (
    <div className="flex-grow overflow-hidden p-4 border rounded-lg shadow flex flex-col items-center justify-center min-h-[400px] bg-card">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading Day View...</p>
      <div className="w-full mt-6 space-y-3">
        <Skeleton className="h-8 w-1/3 mb-4" />
        {Array.from({length: 5}).map((_, i) => (
          <div key={i} className="flex items-start py-2 border-b">
            <Skeleton className="h-6 w-20 mr-3" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function StudyPlannerPage() {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Ensure selectedDate is always a Date
  const [selectedSubject, setSelectedSubject] = useState<string>(ALL_SUBJECTS_FILTER_VALUE);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <div className="w-full flex h-full flex-col space-y-4">
      <PlannerHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedDate={selectedDate}
        onDateChange={handleDateChange} // Use updated handler
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        allSubjectsValue={ALL_SUBJECTS_FILTER_VALUE}
      />
      <div className="flex-grow overflow-hidden">
        {currentView === 'week' && (
          <Suspense fallback={<PlannerViewFallback />}>
            <PlannerView
              selectedDate={selectedDate}
              selectedSubjectFilter={selectedSubject === ALL_SUBJECTS_FILTER_VALUE ? null : selectedSubject}
            />
          </Suspense>
        )}
        {currentView === 'day' && (
           <Suspense fallback={<DayViewFallback />}>
            <DayView
              selectedDate={selectedDate}
              selectedSubjectFilter={selectedSubject === ALL_SUBJECTS_FILTER_VALUE ? null : selectedSubject}
            />
          </Suspense>
        )}
        {currentView === 'month' && (
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6 min-h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground text-xl">Month View Coming Soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

