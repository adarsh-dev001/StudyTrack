
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Task } from '@/components/tasks/task-item'; // Assuming Task type is here
import { parseISO, compareAsc, format, isPast } from 'date-fns';
import { getSubjectInfo, getPriorityBadgeInfo } from '@/components/planner/planner-utils';
import { Badge } from '@/components/ui/badge';
import { ListChecks, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const MAX_TASKS_TO_SHOW = 4;

export default function TaskOverviewWidget() {
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      try {
        const savedTasksRaw = localStorage.getItem('studyTrackTasks');
        const allTasks: Task[] = savedTasksRaw ? JSON.parse(savedTasksRaw) : [];
        
        const filteredAndSorted = allTasks
          .filter(task => !task.completed)
          .sort((a, b) => {
            if (a.deadline && b.deadline) {
              const deadlineComparison = compareAsc(parseISO(a.deadline), parseISO(b.deadline));
              if (deadlineComparison !== 0) return deadlineComparison;
            } else if (a.deadline) return -1;
            else if (b.deadline) return 1;
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });
        setPendingTasks(filteredAndSorted.slice(0, MAX_TASKS_TO_SHOW));
      } catch (error) {
        console.error("Error loading tasks for widget:", error);
        setPendingTasks([]);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-primary" /> Upcoming Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading tasks...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-primary" /> Urgent Tasks
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your next few pending tasks.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          {pendingTasks.length > 0 ? (
            <ScrollArea className="h-[220px] sm:h-[250px]">
              <div className="space-y-2 px-4 pb-4">
                {pendingTasks.map(task => {
                  const subjectInfo = getSubjectInfo(task.subject);
                  const priorityInfo = getPriorityBadgeInfo(task.priority);
                  const isDeadlinePast = task.deadline && isPast(parseISO(task.deadline));
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "p-2.5 rounded-md border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5",
                        subjectInfo.color?.replace('bg-', 'border-') // Use border color from subject
                      )}
                    >
                      <div className="flex-grow overflow-hidden">
                        <p className="text-sm font-medium truncate" title={task.title}>{task.title}</p>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Badge variant="outline" size="sm" className={cn("px-1.5 py-0 text-[10px]", subjectInfo.textColor, subjectInfo.color?.replace('bg-', 'border-'))}>
                            {subjectInfo.name}
                          </Badge>
                          {task.deadline && (
                            <span className={cn("flex items-center", isDeadlinePast && "text-red-500 font-semibold")}>
                              <Clock className="mr-1 h-3 w-3" /> {format(parseISO(task.deadline), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={priorityInfo.variant} size="sm" className={cn("text-xs self-start sm:self-center", priorityInfo.className)}>
                        {priorityInfo.text}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[220px] sm:h-[250px] flex items-center justify-center px-4">
              <p className="text-center text-muted-foreground text-sm">
                No pending tasks right now. Great job, or add some new ones!
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-3">
          <Button variant="outline" size="sm" asChild className="w-full text-xs sm:text-sm">
            <Link href="/tasks">View All Tasks</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
