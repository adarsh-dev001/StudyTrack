
'use client';

import React, { useState, useEffect } from 'react';
import { TaskForm, type TaskFormData } from '@/components/tasks/task-form';
import { TaskItem, type Task } from '@/components/tasks/task-item';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const COINS_FOR_TASK = 2;

export default function TasksPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
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

  const awardCoinsForTask = async () => {
    if (!currentUser?.uid || !db) return;

    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    try {
      const docSnap = await getDoc(userProfileDocRef);
      let newCoins;
      if (docSnap.exists()) {
        const currentCoins = docSnap.data()?.coins || 0;
        newCoins = currentCoins + COINS_FOR_TASK;
        await updateDoc(userProfileDocRef, { coins: newCoins });
      } else {
        newCoins = COINS_FOR_TASK;
        await setDoc(userProfileDocRef, {
          coins: newCoins,
          xp: 0, 
          earnedBadgeIds: [],
          purchasedItemIds: []
        }, { merge: true });
      }
      toast({
        title: 'Task Completed! 👍',
        description: `✨ +${COINS_FOR_TASK} Coins for finishing a task! Great job!`,
      });
    } catch (error) {
      console.error("Error awarding coins for task:", error);
      toast({
        title: 'Coin Award Error',
        description: 'Could not update your coin balance for the task.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleComplete = (id: string) => {
    let taskJustCompleted = false;
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          if (!task.completed) {
            taskJustCompleted = true;
          }
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );

    if (taskJustCompleted && currentUser) {
      awardCoinsForTask();
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">Task Management</h1>
        <p className="text-md sm:text-lg text-muted-foreground">Create, manage, and track your study tasks.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold">Add New Task</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <TaskForm onSubmitTask={handleAddTask} />
        </CardContent>
      </Card>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Pending Tasks ({pendingTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-0"> {/* Adjust padding for scroll area */}
            {pendingTasks.length > 0 ? (
              <ScrollArea className="h-[250px] sm:h-[300px] px-4 sm:px-4 md:px-6">
                <div className="space-y-0">
                  {pendingTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      canEarnCoins={!!currentUser}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4 px-4 sm:px-6 text-sm sm:text-base">No pending tasks. Add some above!</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Completed Tasks ({completedTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-0">
             {completedTasks.length > 0 ? (
              <ScrollArea className="h-[250px] sm:h-[300px] px-4 sm:px-4 md:px-6">
                 <div className="space-y-0">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      canEarnCoins={!!currentUser}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4 px-4 sm:px-6 text-sm sm:text-base">No tasks completed yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
       {!currentUser && (
        <Card className="mt-4">
            <CardContent className="p-4 sm:p-6">
                 <p className="text-xs sm:text-sm text-destructive text-center">
                    Login to earn coins for completing tasks and Pomodoro sessions!
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
