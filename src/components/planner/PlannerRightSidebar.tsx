
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Tag, Plus, CalendarDays, Brain, FileText } from 'lucide-react';
import Image from 'next/image';

interface PlannerRightSidebarProps {
  onAddTask: () => void;
  onGenerateStudyPlan: () => void;
}

export default function PlannerRightSidebar({ onAddTask, onGenerateStudyPlan }: PlannerRightSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-4 border-b">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="study-plans">Study Plans</TabsTrigger>
          </TabsList>
          <div className="mt-4 flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Tag className="mr-1.5 h-3.5 w-3.5" /> Tags
            </Button>
          </div>
          <TabsContent value="events" className="mt-4">
            <div className="text-center py-10">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Image
                  src="https://placehold.co/200x200/E9E7FD/7C3AED?text=Mascot" // Placeholder for mascot
                  alt="No events mascot"
                  layout="fill"
                  objectFit="contain"
                  data-ai-hint="mascot illustration"
                />
              </div>
              <p className="text-sm text-muted-foreground">No upcoming events</p>
              <Button size="sm" className="mt-3 bg-[hsl(var(--theme-purple-medium))] hover:bg-[hsl(var(--theme-purple-dark))] text-white" onClick={onAddTask}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Event
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="study-plans" className="mt-4">
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">Study plan features coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ScrollArea className="flex-grow p-4">
        {/* Content for events or study plans list would go here */}
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <Button className="w-full bg-[hsl(var(--theme-purple-medium))] hover:bg-[hsl(var(--theme-purple-dark))] text-white" onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
        <Button variant="outline" className="w-full border-[hsl(var(--theme-purple-medium))] text-[hsl(var(--theme-purple-medium))] hover:bg-[hsl(var(--theme-purple-light))] hover:text-[hsl(var(--theme-purple-dark))]" onClick={onGenerateStudyPlan}>
          <Brain className="mr-2 h-4 w-4" /> Generate Study Plan
        </Button>
        <Button variant="outline" className="w-full border-[hsl(var(--theme-green-cta))] text-[hsl(var(--theme-green-cta))] hover:bg-green-500/10 hover:text-green-700">
          <CalendarDays className="mr-2 h-4 w-4" /> Import from Google
        </Button>
        <Button variant="outline" className="w-full border-[hsl(var(--theme-green-cta))] text-[hsl(var(--theme-green-cta))] hover:bg-green-500/10 hover:text-green-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-2.78 1.5-5 1.5S8.22 5 6 5a4.91 4.91 0 0 0-5 4.72C1 12.94 4 21 7 21c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>
          Import from Apple
        </Button>
        <Button variant="outline" className="w-full border-[hsl(var(--theme-red-cta))] text-[hsl(var(--theme-red-cta))] hover:bg-red-500/10 hover:text-red-700">
          <FileText className="mr-2 h-4 w-4" /> Import from Canvas
        </Button>
      </div>
    </div>
  );
}
    