
'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  canEarnCoins?: boolean; // Optional prop
}

export function TaskItem({ task, onToggleComplete, onDelete, canEarnCoins }: TaskItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors duration-150">
      <div className="flex items-center gap-3">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          aria-labelledby={`task-label-${task.id}`}
          disabled={!canEarnCoins && !task.completed} // Disable checkbox if not logged in and task not completed
        />
        <label
          htmlFor={`task-${task.id}`}
          id={`task-label-${task.id}`}
          className={cn(
            "text-sm font-medium cursor-pointer",
            task.completed ? "line-through text-muted-foreground" : "text-foreground",
            !canEarnCoins && !task.completed && "cursor-not-allowed opacity-70"
          )}
        >
          {task.title}
        </label>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete task: ${task.title}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
