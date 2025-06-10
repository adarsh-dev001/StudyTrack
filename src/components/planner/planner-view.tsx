
"use client"

import type { ChangeEvent } from "react";
import React, { useState, useEffect, Suspense, useCallback, memo } from "react" // Added useCallback, memo
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  GripVertical,
  Clock,
  BookOpen,
  CheckCircle2,
  Trash2,
  Loader2,
  CalendarDays
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import * as Firestore from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task, Priority } from "./planner-types"; 
import { subjects, getPriorityBadgeInfo, getSubjectInfo, hourToDisplayTime } from "./planner-utils"; 
import { Badge } from "@/components/ui/badge"; 
import { startOfWeek, addDays, format } from "date-fns";
import { recordPlatformInteraction } from '@/lib/activity-utils';

const NewTaskDialogContent = React.lazy(() => import('./new-task-dialog-content'));

interface PlannerViewProps {
  selectedDate: Date; 
  selectedSubjectFilter?: string | null;
  onDateChange: (date: Date) => void;
  onViewChange: (view: 'day' | 'week' | 'month') => void;
}

function NewTaskDialogFallback() {
    return (
        <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-3">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
        </div>
    );
}

interface PlannerTaskDisplayItemProps {
  task: Task;
  onToggleStatus: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDragStartTask: (task: Task, e: React.DragEvent) => void;
}

const PlannerTaskDisplayItem = memo(function PlannerTaskDisplayItem({ task, onToggleStatus, onDeleteTask, onDragStartTask }: PlannerTaskDisplayItemProps) {
  const subjectInfo = getSubjectInfo(task.subject);
  const priorityInfo = getPriorityBadgeInfo(task.priority);
  const endTime = hourToDisplayTime(task.startHour + task.duration);

  return (
    <TooltipProvider key={task.id}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => onDragStartTask(task, e)}
            className={cn(
              "rounded-md p-2 mb-1.5 cursor-move shadow-sm border relative group transition-all duration-200 ease-out transform hover:shadow-lg hover:scale-[1.01]",
              task.status === "completed" ? "opacity-60 bg-opacity-70 line-through" : "opacity-100",
              subjectInfo.color,
              "text-sm"
            )}
            style={{ minHeight: `${Math.max(1, task.duration) * 2.25}rem` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 overflow-hidden pr-1">
                <div className="flex items-center">
                  <GripVertical className="h-4 w-4 mr-1 opacity-50 shrink-0 group-hover:opacity-70" />
                  <h4 className="font-semibold truncate" title={task.title}>{task.title}</h4>
                </div>
                <div className="text-xs mt-0.5 mb-1 opacity-80">
                  <span className="font-medium">{subjectInfo.name}</span>
                  {task.topic && <span className="truncate block" title={task.topic}> {task.topic}</span>}
                </div>
                <div className="flex items-center text-xs opacity-70">
                  <Clock className="h-3 w-3 mr-1 shrink-0" />
                  <span>{task.duration} {task.duration === 1 ? 'hr' : 'hrs'}</span>
                </div>
              </div>
              <div className="flex flex-col items-center ml-1 space-y-0.5">
                <button
                  onClick={() => onToggleStatus(task.id)}
                  className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  title={task.status === "completed" ? "Mark as pending" : "Mark as completed"}
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 opacity-40 hover:opacity-70" />
                  )}
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700 dark:hover:text-red-400" />
                </button>
              </div>
            </div>
            {task.priority && (
              <div className="mt-1.5">
                <Badge variant={priorityInfo.variant} className={priorityInfo.className}>{priorityInfo.text}</Badge>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="w-64">
          <p className="font-semibold text-sm">{task.title}</p>
          <p className="text-xs text-muted-foreground">Subject: {subjectInfo.name}</p>
          {task.topic && <p className="text-xs text-muted-foreground">Topic: {task.topic}</p>}
          <p className="text-xs text-muted-foreground">Time: {hourToDisplayTime(task.startHour)} - {endTime}</p>
          <p className="text-xs text-muted-foreground">Duration: {task.duration} hr(s)</p>
          <p className="text-xs text-muted-foreground capitalize">Priority: {task.priority}</p>
          {task.description && <p className="text-xs text-muted-foreground mt-1">Notes: {task.description}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
});


export function PlannerView({ selectedDate, selectedSubjectFilter, onDateChange, onViewChange }: PlannerViewProps) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [newTask, setNewTask] = useState<Partial<Omit<Task, 'id'>>>({
    priority: "medium",
    status: "pending",
    duration: 1,
    day: selectedDate.getDay(),
    startHour: 9,
    subject: subjects[0].id,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedOver, setDraggedOver] = useState<{ day: number, hour: number } | null>(null)

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const hours = Array.from({ length: 15 }, (_, i) => i + 8) // 8 AM to 10 PM (22:00)

  useEffect(() => {
    if (selectedDate) {
      setNewTask(prev => ({ ...prev, day: selectedDate.getDay() }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!currentUser || !db) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    const tasksCollectionRef = Firestore.collection(db, "users", currentUser.uid, "plannerTasks");
    
    const queryConstraints: Firestore.QueryConstraint[] = [];
    if (selectedSubjectFilter && selectedSubjectFilter !== "all") {
      queryConstraints.push(Firestore.where("subject", "==", selectedSubjectFilter));
    }
    
    const q = Firestore.query(
      tasksCollectionRef, 
      ...queryConstraints
      // Firestore.select("title", "subject", "topic", "description", "duration", "priority", "status", "startHour", "day") // Removed select
    );
    
    const unsubscribe = Firestore.onSnapshot(q, (querySnapshot) => {
      const fetchedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(fetchedTasks);
      setIsLoadingTasks(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setIsLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedSubjectFilter]); 

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string | number) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateTask = useCallback(async () => {
    if (!currentUser || !db) {
      console.error("User not logged in or DB not available");
      return;
    }
    if (!newTask.title || !newTask.subject || newTask.day === undefined || newTask.startHour === undefined || newTask.duration === undefined ) {
      alert("Please fill in all required fields: Title, Subject, Day, Start Time, and Duration.");
      return;
    }

    const taskToSave: Omit<Task, 'id' | 'userId'> & { userId: string } = {
      userId: currentUser.uid,
      title: newTask.title!,
      subject: newTask.subject!,
      topic: newTask.topic || "",
      description: newTask.description || "",
      duration: Number(newTask.duration) || 1,
      priority: newTask.priority as Priority || "medium",
      status: "pending",
      day: Number(newTask.day),
      startHour: Number(newTask.startHour),
    };

    try {
      const tasksCollectionRef = Firestore.collection(db, "users", currentUser.uid, "plannerTasks");
      await Firestore.addDoc(tasksCollectionRef, taskToSave);
      if (currentUser.uid) { 
        await recordPlatformInteraction(currentUser.uid);
      }
      setNewTask({ 
        title: "",
        topic: "",
        description: "",
        priority: "medium",
        status: "pending",
        duration: 1,
        day: selectedDate.getDay(),
        startHour: 9,
        subject: subjects[0].id,
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating task: ", error);
      alert("Failed to create task. Please try again.");
    }
  }, [currentUser, newTask, selectedDate]);

  const handleDragStart = useCallback((task: Task, e: React.DragEvent) => {
    setDraggedTask(task);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id);
    }
  }, []);

  const handleDragOver = useCallback((day: number, hour: number, e: React.DragEvent) => {
    e.preventDefault()
    if(e.dataTransfer) e.dataTransfer.dropEffect = "move";
    setDraggedOver({ day, hour })
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    setDraggedOver(null);
  }, []);

  const handleDrop = useCallback(async (day: number, hour: number) => {
    if (!currentUser || !db || !draggedTask || !draggedTask.id) return;

    const taskDocRef = Firestore.doc(db, "users", currentUser.uid, "plannerTasks", draggedTask.id);
    try {
      await Firestore.updateDoc(taskDocRef, { day, startHour: hour });
      if (currentUser.uid) { 
        await recordPlatformInteraction(currentUser.uid);
      }
    } catch (error) {
      console.error("Error updating task position: ", error);
    }
    setDraggedTask(null)
    setDraggedOver(null)
  }, [currentUser, draggedTask]);

  const toggleTaskStatus = useCallback(async (taskId: string) => {
    if (!currentUser || !db) return;
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const newStatus = taskToUpdate.status === "completed" ? "pending" : "completed";
    const taskDocRef = Firestore.doc(db, "users", currentUser.uid, "plannerTasks", taskId);
    try {
      await Firestore.updateDoc(taskDocRef, { status: newStatus });
      if (newStatus === "completed" && currentUser.uid) { 
         await recordPlatformInteraction(currentUser.uid);
      }
    } catch (error) {
      console.error("Error updating task status: ", error);
    }
  }, [currentUser, tasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!currentUser || !db) return;
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const taskDocRef = Firestore.doc(db, "users", currentUser.uid, "plannerTasks", taskId);
    try {
      await Firestore.deleteDoc(taskDocRef);
      if (currentUser.uid) { 
        await recordPlatformInteraction(currentUser.uid);
      }
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  }, [currentUser]);
  
  const handleDayHeaderClick = useCallback((dayIndexInWeek: number) => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); 
    const clickedDayDate = addDays(weekStart, dayIndexInWeek);
    onDateChange(clickedDayDate);
    onViewChange('day');
  }, [selectedDate, onDateChange, onViewChange]);


  const MainContent = () => {
    if (isLoadingTasks) {
      return (
        <Card className="border-dashed flex-grow flex flex-col items-center justify-center min-h-[400px] bg-muted/20">
          <CardContent className="text-center p-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your study plan...</p>
          </CardContent>
        </Card>
      );
    }

    const tasksForCurrentWeekView = tasks.filter(task => {
        // Week view shows all tasks that fall under a specific day of the week (0-6)
        // No date-specific filtering here, only day of week
        return true; 
    });


    if (tasksForCurrentWeekView.length === 0 && !isLoadingTasks) {
      return (
        <Card className="border-dashed flex-grow flex flex-col items-center justify-center min-h-[400px] bg-muted/20">
          <CardContent className="text-center p-6">
            <div className="mx-auto rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {selectedSubjectFilter && selectedSubjectFilter !== "all"
                ? `No tasks for ${getSubjectInfo(selectedSubjectFilter).name} yet.`
                : "Your Planner is Empty"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {selectedSubjectFilter && selectedSubjectFilter !== "all"
                ? "Add a new task for this subject or clear the filter to see all tasks."
                : "Get started by adding your first study task to the planner!"
              }
            </p>
          </CardContent>
        </Card>
      );
    }
    
    const currentWeekStartDate = startOfWeek(selectedDate, { weekStartsOn: 0 });


    return (
      <div className="overflow-auto flex-grow pb-2 -mx-1">
        <div className="grid grid-cols-[auto_repeat(7,minmax(170px,1fr))] min-w-[1250px]"> 
          <div className="sticky left-0 bg-background z-10 border-r border-border">
            <div className="h-12 border-b border-border"></div> 
            {hours.map(hour => (
              <div key={`time-${hour}`} className="h-24 flex items-center justify-center pr-2 text-xs font-medium text-muted-foreground border-b border-border"> 
                <span>
                  {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? 'am' : 'pm'}
                </span>
              </div>
            ))}
          </div>

          {days.map((dayLabel, dayIndex) => {
            const dayDate = addDays(currentWeekStartDate, dayIndex);
            return (
            <div key={dayLabel} className="border-l border-border first:border-l-0">
              <div
                onClick={() => handleDayHeaderClick(dayIndex)}
                className="h-12 flex flex-col items-center justify-center font-semibold text-sm sticky top-0 bg-background z-10 border-b border-border hover:bg-muted/60 transition-colors cursor-pointer px-1 text-center"
              >
                <span>{dayLabel}</span>
                <span className="text-xs text-muted-foreground font-normal">{format(dayDate, 'd')}</span>
              </div>
              {hours.map(hour => {
                const tasksInSlot = tasksForCurrentWeekView.filter(
                  task => task.day === dayIndex && task.startHour === hour
                );
                const isOver = draggedOver?.day === dayIndex && draggedOver?.hour === hour;

                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={cn(
                      "h-24 p-1 relative border-b border-border", 
                      isOver ? "bg-accent/70 ring-1 ring-primary" : "bg-muted/20 hover:bg-muted/40",
                      tasksInSlot.length > 0 ? "" : "border-dashed border-border/60"
                    )}
                    onDragOver={(e) => handleDragOver(dayIndex, hour, e)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(dayIndex, hour)}
                  >
                    <ScrollArea className="h-full">
                      <div className="p-px">
                      {tasksInSlot.length > 0 ?
                        tasksInSlot.map(task => 
                          <PlannerTaskDisplayItem 
                            key={task.id} 
                            task={task} 
                            onToggleStatus={toggleTaskStatus} 
                            onDeleteTask={handleDeleteTask}
                            onDragStartTask={handleDragStart}
                          />
                        ) :
                        (isOver && draggedTask) && (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-xs opacity-70">
                            Drop here
                          </div>
                        )
                      }
                      </div>
                    </ScrollArea>
                  </div>
                )
              })}
            </div>
          )})}
        </div>
      </div>
    );
  };


  return (
    <div className="p-1 h-full flex flex-col">
      {currentUser && (
        <div className="flex justify-end mb-3 px-1 shrink-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default">
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Study Task</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new study task. Fields marked with <span className="text-destructive">*</span> are required.
                </DialogDescription>
              </DialogHeader>
              <Suspense fallback={<NewTaskDialogFallback />}>
                  <NewTaskDialogContent
                      newTask={newTask}
                      onInputChange={handleInputChange}
                      onSelectChange={handleSelectChange}
                      isDayView={false} 
                  />
              </Suspense>
              <DialogFooter className="mt-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTask} disabled={!newTask.title || !newTask.subject || newTask.day === undefined || newTask.startHour === undefined || newTask.duration === undefined}>Save Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {!currentUser && (
         <Card className="border-dashed flex-grow flex flex-col items-center justify-center min-h-[400px] bg-muted/20">
          <CardContent className="pt-6 text-center p-6">
            <div className="mx-auto rounded-full bg-primary/10 p-4 w-16 h-16 flex items-center justify-center mb-4">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Login to Plan Your Studies</h3>
            <p className="text-muted-foreground mb-6">
              Please login or sign up to start organizing your study schedule and track your progress.
            </p>
          </CardContent>
        </Card>
      )}
      
      {currentUser && <MainContent />}

      {currentUser && tasks.length > 0 && (
         <Card className="mt-3 shrink-0">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold">Subject Color Legend</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {subjects.map(subject => (
                <div
                  key={subject.id}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs flex items-center border text-center",
                    subject.color
                  )}
                >
                  {subject.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

