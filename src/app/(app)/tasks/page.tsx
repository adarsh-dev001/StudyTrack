
'use client';

import React, { useState, useEffect } from 'react';
import { TaskForm, type TaskFormData } from '@/components/tasks/task-form';
import { TaskItem, type Task } from '@/components/tasks/task-item';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('studyTrackTasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studyTrackTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleAddTask = (data: TaskFormData) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: data.title,
      completed: false,
    };
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="w-full max-w-none px-0 mx-0 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Task Management</h1>
        <p className="text-lg text-muted-foreground">Create, manage, and track your study tasks.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm onSubmitTask={handleAddTask} />
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Pending Tasks ({pendingTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length > 0 ? (
              <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-0">
                  {pendingTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4">No pending tasks. Add some above!</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Completed Tasks ({completedTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
             {completedTasks.length > 0 ? (
              <ScrollArea className="h-[300px] pr-3">
                 <div className="space-y-0">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4">No tasks completed yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
