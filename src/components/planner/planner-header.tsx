
"use client"

import type { Dispatch, SetStateAction } from "react";
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

// Re-defining subjects here for the filter dropdown.
// Ensure these values match those used in PlannerView for consistency.
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
  allSubjectsValue: string; // e.g., "all"
  // onAddTask is handled by PlannerView's dialog for now
}

export function PlannerHeader({
  currentView,
  onViewChange,
  selectedDate,
  onDateChange,
  selectedSubject,
  onSubjectChange,
  allSubjectsValue,
}: PlannerHeaderProps) {

  return (
    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center pb-2 border-b">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Study Planner</h1>
      
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup type="single" value={currentView} onValueChange={(value) => { if (value) onViewChange(value as 'day' | 'week' | 'month'); }}>
          <ToggleGroupItem value="day" aria-label="Day view">Day</ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Week view">Week</ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Month view">Month</ToggleGroupItem>
        </ToggleGroup>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal w-full sm:w-[200px]",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={allSubjectsValue}>All Subjects</SelectItem>
            {filterSubjects.map(subject => (
              <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* The "New Task" button is part of PlannerView's dialog trigger, 
            so it's not duplicated here unless a different global add is needed. */}
        {/* <Button>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button> */}
      </div>
    </div>
  )
}
