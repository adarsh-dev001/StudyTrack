
'use client';

import { useState } from 'react';
import { PlannerHeader } from '@/components/planner/planner-header';
import { PlannerView } from '@/components/planner/planner-view';

// Define subjects here to be accessible by both header and view if needed,
// or ensure they are consistent if defined separately.
// For simplicity, we'll let PlannerHeader and PlannerView manage their own subject lists for now,
// but ensure the 'value' for "All Subjects" is consistent (e.g., "all").
const ALL_SUBJECTS_FILTER_VALUE = "all";

export default function StudyPlannerPage() {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>(ALL_SUBJECTS_FILTER_VALUE);

  return (
    <div className="w-full max-w-none px-0 mx-0 flex h-full flex-col space-y-4">
      <PlannerHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        allSubjectsValue={ALL_SUBJECTS_FILTER_VALUE}
      />
      <div className="flex-grow overflow-hidden">
        {currentView === 'week' && (
          <PlannerView 
            selectedDate={selectedDate} 
            selectedSubjectFilter={selectedSubject === ALL_SUBJECTS_FILTER_VALUE ? null : selectedSubject} 
          />
        )}
        {currentView === 'day' && (
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6 min-h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground text-xl">Day View Coming Soon!</p>
          </div>
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
