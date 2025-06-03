
'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getSubjectInfo, getPriorityBadgeInfo } from '@/components/planner/planner-utils'; // Assuming these utils are appropriate

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  subject: string; 
  deadline: string | null; 
  priority: TaskPriority;
  completed: boolean;
  createdAt: string; 
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void; 
  canEarnCoins?: boolean;
}

export function TaskItem({ task, onToggleComplete, onDelete, onEdit, canEarnCoins }: TaskItemProps) {
  const subjectInfo = getSubjectInfo(task.subject);
  const priorityInfo = getPriorityBadgeInfo(task.priority);
  const isDeadlinePast = task.deadline && !task.completed && isPast(parseISO(task.deadline));

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 my-1 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-150", // Reduced my-2 to my-1
      task.completed ? "bg-muted/50 opacity-70" : subjectInfo.color,
      task.completed && "border-gray-300 dark:border-gray-600"
    )}>
      <div className="flex items-start gap-3 flex-grow mb-2 sm:mb-0">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          aria-labelledby={`task-label-${task.id}`}
          disabled={!canEarnCoins && !task.completed}
          className={cn("mt-1 shrink-0", task.completed ? "border-gray-400 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500" : "")}
        />
        <div className="flex-grow">
          <label
            htmlFor={`task-${task.id}`}
            id={`task-label-${task.id}`}
            className={cn(
              "text-sm font-medium cursor-pointer break-words",
              task.completed ? "line-through text-muted-foreground" : subjectInfo.textColor,
              !canEarnCoins && !task.completed && "cursor-not-allowed opacity-70"
            )}
          >
            {task.title}
          </label>
          <div className="text-xs mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
            <Badge variant="outline" size="sm" className={cn("border-opacity-50 text-opacity-80 px-1.5 py-0 text-[10px]", subjectInfo.textColor, subjectInfo.color?.replace('bg-', 'border-'))}>
                {subjectInfo.name}
            </Badge>
            {task.deadline && (
              <span className={cn(
                "text-xs",
                task.completed ? "text-muted-foreground" : subjectInfo.textColor,
                isDeadlinePast && "text-red-600 dark:text-red-400 font-semibold"
              )}>
                Due: {format(parseISO(task.deadline), 'MMM d, yyyy')}
                {isDeadlinePast && " (Past Due)"}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
        <Badge variant={priorityInfo.variant} size="sm" className={cn(priorityInfo.className, "text-xs px-1.5 py-0")}>{priorityInfo.text}</Badge>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
            aria-label={`Edit task: ${task.title}`}
            className={cn("h-7 w-7 sm:h-8 sm:w-8", task.completed ? "text-muted-foreground hover:text-muted-foreground/80" : "text-muted-foreground hover:text-primary")}
            disabled={task.completed}
        >
            <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task: ${task.title}`}
          className={cn("h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive", task.completed && "hover:text-red-400")}
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
