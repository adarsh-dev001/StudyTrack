
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Dot, Loader2, BookOpen } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  getDay, // 0 for Sunday, 1 for Monday, etc.
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Task } from './planner-types';
import { getSubjectInfo } from './planner-utils';

interface MonthViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void; // Changed from Date | undefined
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  selectedSubjectFilter: string | null;
}

export default function MonthView({
  selectedDate,
  onDateChange,
  onViewChange,
  selectedSubjectFilter,
}: MonthViewProps) {
  const { currentUser } = useAuth();
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(startOfMonth(selectedDate));
  const [tasksForMonth, setTasksForMonth] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    setCurrentDisplayMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    if (!currentUser || !db) {
      setTasksForMonth([]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    const tasksCollectionRef = collection(db, 'users', currentUser.uid, 'plannerTasks');
    
    let q;
    if (selectedSubjectFilter && selectedSubjectFilter !== "all") {
      q = query(tasksCollectionRef, where("subject", "==", selectedSubjectFilter));
    } else {
      q = query(tasksCollectionRef);
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasksForMonth(fetchedTasks);
      setIsLoadingTasks(false);
    }, (error) => {
      console.error("Error fetching tasks for MonthView: ", error);
      setIsLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedSubjectFilter]);

  const daysInMonthGrid = useMemo(() => {
    const monthStart = startOfMonth(currentDisplayMonth);
    const monthEnd = endOfMonth(currentDisplayMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Ensure week starts on Sunday for consistency
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDisplayMonth]);

  const tasksByDayOfWeek = useMemo(() => {
    const tasksMap: Record<number, Task[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    tasksForMonth.forEach(task => {
      if (tasksMap[task.day]) {
        tasksMap[task.day].push(task);
      }
    });
    return tasksMap;
  }, [tasksForMonth]);

  const handlePrevMonth = () => {
    setCurrentDisplayMonth(subMonths(currentDisplayMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentDisplayMonth(addMonths(currentDisplayMonth, 1));
  };

  const handleDayClick = (day: Date) => {
    onDateChange(day);
    onViewChange('day');
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!currentUser) {
    return (
       <Card className="border-dashed flex-grow flex flex-col items-center justify-center min-h-[400px] bg-muted/20">
        <CardContent className="pt-6 text-center p-6">
            <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Login to View Monthly Plan</h3>
          <p className="text-muted-foreground">Please login to see your tasks on the calendar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg flex-grow flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-2 sm:px-4 md:px-6">
        <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center">
          {format(currentDisplayMonth, 'MMMM yyyy')}
        </CardTitle>
        <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-1 sm:p-2">
        {isLoadingTasks && (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        {!isLoadingTasks && (
          <div className="grid grid-cols-7 gap-px bg-border flex-grow border-l border-t">
            {dayHeaders.map(header => (
              <div key={header} className="py-1.5 sm:py-2 text-center text-xs sm:text-sm font-medium text-muted-foreground bg-muted/50 border-r border-b">
                {header}
              </div>
            ))}
            {daysInMonthGrid.map((day, index) => {
              const dayOfWeek = getDay(day); // 0 for Sunday, 6 for Saturday
              const tasksOnThisDayOfWeek = tasksByDayOfWeek[dayOfWeek] || [];
              const isCurrentMonth = isSameMonth(day, currentDisplayMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'p-1 sm:p-1.5 min-h-[50px] xs:min-h-[60px] sm:min-h-[70px] md:min-h-[90px] cursor-pointer relative transition-colors duration-150 ease-in-out border-r border-b flex flex-col',
                    isCurrentMonth ? 'bg-background hover:bg-secondary/60' : 'bg-muted/30 text-muted-foreground/50 hover:bg-muted/50',
                    isSelected && 'bg-primary/20 ring-2 ring-primary z-10',
                    isToday && !isSelected && 'bg-accent/10'
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  <span className={cn(
                    'text-xs sm:text-sm self-start',
                    isToday && 'font-bold text-primary'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && tasksOnThisDayOfWeek.length > 0 && (
                     <div className="flex flex-wrap gap-0.5 mt-auto justify-start items-end">
                       {tasksOnThisDayOfWeek.slice(0, window.innerWidth < 400 ? 1 : window.innerWidth < 640 ? 2 : 3).map(task => ( // Show fewer dots on smaller screens
                         <Dot key={task.id} className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3", getSubjectInfo(task.subject).textColor)} />
                       ))}
                       {tasksOnThisDayOfWeek.length > (window.innerWidth < 400 ? 1 : window.innerWidth < 640 ? 2 : 3) && 
                         <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">+ {tasksOnThisDayOfWeek.length - (window.innerWidth < 400 ? 1 : window.innerWidth < 640 ? 2 : 3)}</span>
                       }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
