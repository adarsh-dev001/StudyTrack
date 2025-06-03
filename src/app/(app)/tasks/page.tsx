
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TaskForm, type TaskFormData } from '@/components/tasks/task-form';
import { TaskItem, type Task, type TaskPriority } from '@/components/tasks/task-item';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { recordPlatformInteraction } from '@/lib/activity-utils';
import { parseISO, compareAsc } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ListFilter, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subjects } from '@/components/planner/planner-utils';

const COINS_FOR_TASK = 2;
const ALL_SUBJECTS_FILTER = "all";

export default function TasksPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>(ALL_SUBJECTS_FILTER);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('studyTrackTasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studyTrackTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleAddTask = (data: TaskFormData) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: data.title,
      subject: data.subject,
      deadline: data.deadline ? data.deadline.toISOString() : null,
      priority: data.priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  const handleEditTask = (updatedTaskData: TaskFormData) => {
    if (!editingTask) return;
    
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTask.id
          ? {
              ...task,
              title: updatedTaskData.title,
              subject: updatedTaskData.subject,
              deadline: updatedTaskData.deadline ? updatedTaskData.deadline.toISOString() : null,
              priority: updatedTaskData.priority,
            }
          : task
      )
    );
    setIsEditModalOpen(false);
    setEditingTask(null);
    toast({ title: "Task Updated", description: "Your task details have been saved." });
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const awardCoinsAndRecordInteraction = async () => {
    if (!currentUser?.uid || !db) return;
    await recordPlatformInteraction(currentUser.uid);
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
        const initialProfile = { coins: newCoins, xp: 0, earnedBadgeIds: [], purchasedItemIds: [], onboardingCompleted: false, lastInteractionDates: [new Date().toISOString().split('T')[0]]};
        await setDoc(userProfileDocRef, initialProfile, { merge: true });
      }
      toast({
        title: 'Task Completed! 👍',
        description: `✨ +${COINS_FOR_TASK} Coins for finishing a task! Great job!`,
      });
    } catch (error) {
      console.error("Error awarding coins for task:", error);
      toast({ title: 'Coin Award Error', description: 'Could not update your coin balance.', variant: 'destructive' });
    }
  };

  const handleToggleComplete = (id: string) => {
    let taskJustCompleted = false;
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === id) {
          if (!task.completed) taskJustCompleted = true;
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );
    if (taskJustCompleted && currentUser) {
      awardCoinsAndRecordInteraction();
    }
  };

  const handleDeleteTask = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    toast({ title: "Task Deleted", description: "The task has been removed." });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const subjectMatch = subjectFilter === ALL_SUBJECTS_FILTER || task.subject === subjectFilter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      return subjectMatch && priorityMatch;
    });
  }, [tasks, subjectFilter, priorityFilter]);

  const pendingTasks = useMemo(() => {
    return filteredTasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        // Sort by deadline (earliest first, nulls last)
        if (a.deadline && b.deadline) {
          const deadlineComparison = compareAsc(parseISO(a.deadline), parseISO(b.deadline));
          if (deadlineComparison !== 0) return deadlineComparison;
        } else if (a.deadline) return -1; // a has deadline, b doesn't, a comes first
        else if (b.deadline) return 1;  // b has deadline, a doesn't, b comes first

        // Then sort by priority (high > medium > low)
        const priorityOrder: Record<TaskPriority, number> = { high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] < priorityOrder[b.priority]) return -1;
        if (priorityOrder[a.priority] > priorityOrder[b.priority]) return 1;
        
        // Finally, sort by creation date (newest first for pending)
        return compareAsc(parseISO(b.createdAt), parseISO(a.createdAt));
      });
  }, [filteredTasks]);

  const completedTasks = useMemo(() => {
    return filteredTasks
      .filter(task => task.completed)
      .sort((a,b) => compareAsc(parseISO(b.createdAt), parseISO(a.createdAt))); // Newest completed first
  }, [filteredTasks]);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">Task Management</h1>
        <p className="text-md sm:text-lg text-muted-foreground">Create, manage, and track your study tasks efficiently.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold">Add New Task</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Plan your studies by adding tasks with subjects, deadlines, and priorities.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <TaskForm onSubmitTask={handleAddTask} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold">Your Tasks</CardTitle>
            <CardDescription className="text-xs sm:text-sm">View, filter, and manage your pending and completed tasks.</CardDescription>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full xs:w-auto text-xs sm:text-sm h-9">
                <ListFilter className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SUBJECTS_FILTER}>All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}>
              <SelectTrigger className="w-full xs:w-auto text-xs sm:text-sm h-9">
                <ListFilter className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
             {(subjectFilter !== ALL_SUBJECTS_FILTER || priorityFilter !== "all") && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setSubjectFilter(ALL_SUBJECTS_FILTER); setPriorityFilter("all");}} 
                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                    title="Clear Filters"
                >
                    <X className="h-4 w-4"/>
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-2">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="p-2 md:p-0">
              <h3 className="text-md font-semibold mb-2 px-2 md:px-4">Pending Tasks ({pendingTasks.length})</h3>
              {pendingTasks.length > 0 ? (
                <ScrollArea className="h-[300px] sm:h-[350px] px-2 md:px-4">
                  <div className="space-y-0">
                    {pendingTasks.map(task => (
                      <TaskItem
                        key={task.id} task={task}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteTask}
                        onEdit={openEditModal}
                        canEarnCoins={!!currentUser}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-4 px-2 md:px-4 text-sm">No pending tasks matching filters. Well done or adjust filters!</p>
              )}
            </div>

            <div className="p-2 md:p-0 border-t md:border-t-0 md:border-l">
              <h3 className="text-md font-semibold mb-2 px-2 md:px-4">Completed Tasks ({completedTasks.length})</h3>
              {completedTasks.length > 0 ? (
                <ScrollArea className="h-[300px] sm:h-[350px] px-2 md:px-4">
                  <div className="space-y-0">
                    {completedTasks.map(task => (
                      <TaskItem
                        key={task.id} task={task}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteTask}
                        onEdit={openEditModal}
                        canEarnCoins={!!currentUser}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-4 px-2 md:px-4 text-sm">No tasks completed yet, or none match filters.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!currentUser && (
        <Card className="mt-4">
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-destructive text-center">
              Login to earn coins for completing tasks! Your tasks are currently saved in this browser only.
            </p>
          </CardContent>
        </Card>
      )}

      {editingTask && (
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setEditingTask(null); // Clear editing task when dialog closes
            }
            setIsEditModalOpen(isOpen);
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Update the details of your study task.</DialogDescription>
            </DialogHeader>
            <TaskForm
              onSubmitTask={handleEditTask}
              initialData={{
                title: editingTask.title,
                subject: editingTask.subject,
                deadline: editingTask.deadline ? parseISO(editingTask.deadline) : null,
                priority: editingTask.priority,
              }}
              isEditMode={true}
            />
            {/* Footer with close button can be added if needed, or rely on X */}
            <DialogFooter className="mt-3">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
