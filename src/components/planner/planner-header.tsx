
"use client"

import type { Dispatch, SetStateAction } from "react";
import React from 'react';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react" // Added ChevronLeft, ChevronRight
import { format, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

const filterSubjects = [
  { id: "physics", name: "Physics" },
  { id: "chemistry", name: "Chemistry" },
  { id: "biology", name: "Biology" },
  { id: "mathematics", name: "Mathematics" },
  { id: "english", name: "English" },
  { id: "history", name: "History" },
  { id: "other", name: "Other" },
];

interface PlannerHeaderProps {
  currentView: 'day' | 'week' | 'month';
  onViewChange: Dispatch<SetStateAction<'day' | 'week' | 'month'>>;
  selectedDate: Date; // Made selectedDate mandatory as per design
  onDateChange: (date: Date) => void; // Made onDateChange mandatory
  selectedSubject: string;
  onSubjectChange: Dispatch<SetStateAction<string>>;
  allSubjectsValue: string;
}

export const PlannerHeader = React.memo(function PlannerHeaderComponent({
  currentView,
  onViewChange,
  selectedDate,
  onDateChange,
  selectedSubject,
  onSubjectChange,
  allSubjectsValue,
}: PlannerHeaderProps) {

  const handlePrev = () => {
    if (currentView === 'week') {
      onDateChange(addDays(selectedDate, -7));
    } else if (currentView === 'month') {
      onDateChange(subMonths(selectedDate, 1));
    } else { // day view
      onDateChange(addDays(selectedDate, -1));
    }
  };

  const handleNext = () => {
    if (currentView === 'week') {
      onDateChange(addDays(selectedDate, 7));
    } else if (currentView === 'month') {
      onDateChange(addMonths(selectedDate, 1));
    } else { // day view
      onDateChange(addDays(selectedDate, 1));
    }
  };
  
  const handleToday = () => {
    onDateChange(new Date());
  }

  const getDateRangeDisplay = () => {
    if (currentView === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Assuming Sunday start
      const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
      if (format(start, 'MMM') === format(end, 'MMM')) {
        return `${format(start, 'MMM d')} - ${format(end, 'd')}`;
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
    if (currentView === 'month') {
      return format(selectedDate, 'MMMM yyyy');
    }
    return format(selectedDate, 'MMMM d, yyyy'); // Day view
  };


  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrev} className="h-9 w-9">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="outline" onClick={handleToday} className="px-3 h-9 text-sm">
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold text-foreground ml-2 sm:ml-4 whitespace-nowrap">
          {getDateRangeDisplay()}
        </h2>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Select value={selectedSubject} onValueChange={onSubjectChange}>
          <SelectTrigger className="w-full sm:w-auto md:w-[180px] text-xs sm:text-sm h-9">
            <Filter className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allSubjectsValue} className="text-xs sm:text-sm">All Subjects</SelectItem>
            {filterSubjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id} className="text-xs sm:text-sm">{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup 
          type="single" 
          value={currentView} 
          onValueChange={(value) => { if (value) onViewChange(value as 'day' | 'week' | 'month'); }}
          className="w-full sm:w-auto rounded-md overflow-hidden border bg-background"
        >
          <ToggleGroupItem value="day" aria-label="Day view" className="flex-1 sm:flex-none data-[state=on]:bg-primary/20 data-[state=on]:text-primary text-xs sm:text-sm px-2.5 py-1.5 h-9">Day</ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Week view" className="flex-1 sm:flex-none data-[state=on]:bg-primary/20 data-[state=on]:text-primary text-xs sm:text-sm px-2.5 py-1.5 h-9">Week</ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Month view" className="flex-1 sm:flex-none data-[state=on]:bg-primary/20 data-[state=on]:text-primary text-xs sm:text-sm px-2.5 py-1.5 h-9">Month</ToggleGroupItem>
        </ToggleGroup>
        
        {/* The "Add Task" button from the original header is now moved to the new right sidebar or the DayView/PlannerView components */}
      </div>
    </div>
  )
});

    