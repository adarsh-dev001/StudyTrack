
"use client"

import type { Dispatch, SetStateAction } from "react";
import React from 'react';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Filter } from "lucide-react"
import { format } from "date-fns"
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
  selectedDate: Date | undefined;
  onDateChange: Dispatch<SetStateAction<Date | undefined>>;
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

  return (
    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center pb-3 sm:pb-4 border-b">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight md:text-3xl whitespace-nowrap">Study Planner</h1>
      
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
        <ToggleGroup 
          type="single" 
          value={currentView} 
          onValueChange={(value) => { if (value) onViewChange(value as 'day' | 'week' | 'month'); }}
          className="w-full sm:w-auto rounded-md overflow-hidden"
        >
          <ToggleGroupItem value="day" aria-label="Day view" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 h-9 sm:h-10">Day</ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Week view" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 h-9 sm:h-10">Week</ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Month view" className="flex-1 sm:flex-none text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 h-9 sm:h-10">Month</ToggleGroupItem>
        </ToggleGroup>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal w-full sm:w-[180px] md:w-[200px] text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedSubject} onValueChange={onSubjectChange}>
          <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3">
            <Filter className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allSubjectsValue} className="text-xs sm:text-sm">All Subjects</SelectItem>
            {filterSubjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id} className="text-xs sm:text-sm">{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
      </div>
    </div>
  )
});
