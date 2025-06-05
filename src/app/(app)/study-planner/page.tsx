
'use client';

import React, { useState, Suspense } from 'react';
import { PlannerHeader } from '@/components/planner/planner-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const PlannerView = React.lazy(() => import('@/components/planner/planner-view').then(module => ({ default: module.PlannerView })));
const DayView = React.lazy(() => import('@/components/planner/day-view'));
const MonthView = React.lazy(() => import('@/components/planner/month-view'));


const ALL_SUBJECTS_FILTER_VALUE = "all";

// Fallback components for lazy loading
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

function MonthViewFallback() {
  return (
    <div className="flex-grow overflow-hidden p-4 border rounded-lg shadow flex flex-col items-center justify-center min-h-[400px] bg-card">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading Month View...</p>
      <div className="w-full mt-6 space-y-3">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-7 gap-1">
            {Array.from({length: 7}).map((_, i) => <Skeleton key={`header-${i}`} className="h-8 w-full opacity-50" />)}
            {Array.from({length: 35}).map((_, i) => <Skeleton key={`day-${i}`} className="h-20 w-full opacity-30" />)}
        </div>
      </div>
    </div>
  );
}


export default function StudyPlannerPage() {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>(ALL_SUBJECTS_FILTER_VALUE);

  const handleDateChange = (date: Date | undefined) => {
    if (date instanceof Date) {
      setSelectedDate(date);
    }
  };

  return (
    <div className="w-full flex h-full flex-col space-y-4">
      <PlannerHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
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
              onDateChange={setSelectedDate}
              onViewChange={setCurrentView}
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
          <Suspense fallback={<MonthViewFallback />}>
            <MonthView
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onViewChange={setCurrentView}
                selectedSubjectFilter={selectedSubject === ALL_SUBJECTS_FILTER_VALUE ? null : selectedSubject}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
    
