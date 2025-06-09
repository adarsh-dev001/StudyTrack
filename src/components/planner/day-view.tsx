
"use client";

import type { ChangeEvent } from "react";
import React, { useState, useEffect, Suspense, useCallback, memo } from "react"; // Added useCallback, memo
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Clock,
  BookOpen,
  CheckCircle2,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  select, 
} from "firebase/firestore";
import { format } from "date-fns";
import type { Task, Priority } from "./planner-types";
import { subjects, getPriorityBadgeInfo, getSubjectInfo, hourToDisplayTime } from "./planner-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { recordPlatformInteraction } from '@/lib/activity-utils';

const NewTaskDialogContent = React.lazy(() => import('./new-task-dialog-content'));

interface DayViewProps {
  selectedDate: Date;
  selectedSubjectFilter: string | null;
}

function NewTaskDialogFallback() {
    return (
        <div className="grid gap-4 py-4 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto pr-3">
            <Skeleton className="h-9 sm:h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"><Skeleton className="h-9 sm:h-10 w-full" /><Skeleton className="h-9 sm:h-10 w-full" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"><Skeleton className="h-9 sm:h-10 w-full" /><Skeleton className="h-9 sm:h-10 w-full" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"><Skeleton className="h-9 sm:h-10 w-full" /><Skeleton className="h-9 sm:h-10 w-full" /></div>
            <Skeleton className="h-16 sm:h-20 w-full" />
        </div>
    );
}

interface DayViewTaskCardProps {
  task: Task;
  onToggleStatus: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const DayViewTaskCard = memo(function DayViewTaskCard({ task, onToggleStatus, onDeleteTask }: DayViewTaskCardProps) {
  const subjectInfo = getSubjectInfo(task.subject);
  const priorityInfo = getPriorityBadgeInfo(task.priority);
  const endTime = hourToDisplayTime(task.startHour + task.duration);

  return (
    <TooltipProvider key={task.id}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Card className={cn(
              "mb-2 sm:mb-3 shadow-md border transition-all duration-200 ease-out transform hover:shadow-lg hover:scale-[1.01]", 
              subjectInfo.color, 
              task.status === "completed" ? "opacity-60 line-through" : ""
          )}>
            <CardHeader className="pb-1.5 sm:pb-2 pt-2 sm:pt-3 px-2 sm:px-3">
              <div className="flex justify-between items-start gap-1 sm:gap-2">
                <CardTitle className={cn("text-sm sm:text-base font-semibold leading-tight break-words", subjectInfo.textColor)} title={task.title}>
                  {task.title}
                </CardTitle>
                <div className="flex items-center space-x-0.5 sm:space-x-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6" onClick={() => onToggleStatus(task.id)} title={task.status === "completed" ? "Mark pending" : "Mark completed"}>
                    {task.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" /> : <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50 hover:opacity-100" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6" onClick={() => onDeleteTask(task.id)} title="Delete task">
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 hover:text-red-700" />
                  </Button>
                </div>
              </div>
              <div className={cn("text-xs opacity-90", subjectInfo.textColor)}>
                <span className="font-medium">{subjectInfo.name}</span>
                {task.topic && <span className="ml-1 break-all"> - {task.topic}</span>}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 pb-2 sm:pb-3 text-xs">
              {task.description && <p className={cn("mb-1.5 sm:mb-2 opacity-80 break-words", subjectInfo.textColor)}>{task.description}</p>}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                <div className={cn("flex items-center opacity-80", subjectInfo.textColor)}>
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{hourToDisplayTime(task.startHour)} ({task.duration} {task.duration === 1 ? "hr" : "hrs"})</span>
                </div>
                <Badge variant={priorityInfo.variant} className={cn("mt-1 sm:mt-0 text-[10px] sm:text-xs px-1.5 py-0.5", priorityInfo.className)}>{priorityInfo.text}</Badge>
              </div>
            </CardContent>
          </Card>
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
  );
});


export default function DayView({ selectedDate, selectedSubjectFilter }: DayViewProps) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [newTask, setNewTask] = useState<Partial<Omit<Task, "id">>>({
    priority: "medium",
    status: "pending",
    duration: 1,
    day: selectedDate.getDay(),
    startHour: 9,
    subject: subjects[0].id,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  useEffect(() => {
    setNewTask(prev => ({ ...prev, day: selectedDate.getDay() }));
  }, [selectedDate]);

  useEffect(() => {
    if (!currentUser || !db) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    const tasksCollectionRef = collection(db, "users", currentUser.uid, "plannerTasks");
    
    const dayOfWeek = selectedDate.getDay();
    const selectFields = select("title", "subject", "topic", "description", "duration", "priority", "status", "startHour", "day");
    let q;

    if (selectedSubjectFilter && selectedSubjectFilter !== "all") {
      q = query(tasksCollectionRef, where("day", "==", dayOfWeek), where("subject", "==", selectedSubjectFilter), selectFields);
    } else {
      q = query(tasksCollectionRef, where("day", "==", dayOfWeek), selectFields);
    }
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      fetchedTasks.sort((a, b) => a.startHour - b.startHour);
      setTasks(fetchedTasks);
      setIsLoadingTasks(false);
    }, (error) => {
      console.error("Error fetching tasks for DayView: ", error);
      setIsLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedDate, selectedSubjectFilter]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string | number) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateTask = useCallback(async () => {
    if (!currentUser || !db) return;
    if (!newTask.title || !newTask.subject || newTask.startHour === undefined || newTask.duration === undefined) {
      alert("Please fill in all required fields: Title, Subject, Start Time, and Duration.");
      return;
    }

    const taskToSave: Omit<Task, "id" | "userId"> & { userId: string } = {
      userId: currentUser.uid,
      title: newTask.title!,
      subject: newTask.subject!,
      topic: newTask.topic || "",
      description: newTask.description || "",
      duration: Number(newTask.duration) || 1,
      priority: newTask.priority as Priority || "medium",
      status: "pending",
      day: selectedDate.getDay(),
      startHour: Number(newTask.startHour),
    };

    try {
      await addDoc(collection(db, "users", currentUser.uid, "plannerTasks"), taskToSave);
      if (currentUser.uid) { 
        await recordPlatformInteraction(currentUser.uid);
      }
      setNewTask({
        title: "", topic: "", description: "",
        priority: "medium", status: "pending", duration: 1,
        day: selectedDate.getDay(), startHour: 9, subject: subjects[0].id,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating task: ", error);
      alert("Failed to create task. Please try again.");
    }
  }, [currentUser, newTask, selectedDate]);

  const toggleTaskStatus = useCallback(async (taskId: string) => {
    if (!currentUser || !db) return;
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const newStatus = taskToUpdate.status === "completed" ? "pending" : "completed";
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "plannerTasks", taskId), { status: newStatus });
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
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "plannerTasks", taskId));
       if (currentUser.uid) { 
        await recordPlatformInteraction(currentUser.uid);
      }
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  }, [currentUser]);


  if (isLoadingTasks) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/20 rounded-lg">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" />
        <p className="text-muted-foreground text-sm sm:text-base">Loading tasks for {format(selectedDate, "EEEE, MMM d")}...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card className="border-dashed flex-grow flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] bg-muted/20 p-4">
        <CardContent className="pt-6 text-center">
             <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">Login to Plan Your Day</h3>
          <p className="text-muted-foreground text-sm sm:text-base">Please login to view and manage your daily study schedule.</p>
        </CardContent>
      </Card>
    );
  }
  
  const tasksByHour: Record<number, Task[]> = {};
  tasks.forEach(task => {
    if (!tasksByHour[task.startHour]) {
      tasksByHour[task.startHour] = [];
    }
    tasksByHour[task.startHour].push(task);
  });


  return (
    <div className="flex-grow flex flex-col p-1 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 px-1 sm:px-2 gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          Tasks for: {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm" variant="default">
              <Plus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Add New Task for {format(selectedDate, "EEEE")}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Fill in the details for your new study task for {format(selectedDate, "MMMM d")}. Required fields are marked with <span className="text-destructive">*</span>.
              </DialogDescription>
            </DialogHeader>
            <Suspense fallback={<NewTaskDialogFallback />}>
                <NewTaskDialogContent
                    newTask={{...newTask, day: selectedDate.getDay() }}
                    onInputChange={handleInputChange}
                    onSelectChange={handleSelectChange}
                    isDayView={true}
                />
            </Suspense>
            <DialogFooter className="mt-2 pt-3 sm:pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm" className="text-xs sm:text-sm">Cancel</Button>
              <Button onClick={handleCreateTask} disabled={!newTask.title || !newTask.subject || newTask.startHour === undefined || newTask.duration === undefined} size="sm" className="text-xs sm:text-sm">Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 && !isLoadingTasks && (
        <Card className="border-dashed flex-grow flex flex-col items-center justify-center min-h-[250px] sm:min-h-[300px] bg-muted/20">
          <CardContent className="text-center p-4 sm:p-6">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary mx-auto mb-3 sm:mb-4" />
            <h3 className="text-md sm:text-lg font-semibold mb-1 text-foreground">No tasks for {format(selectedDate, "EEEE")}.</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {selectedSubjectFilter && selectedSubjectFilter !== "all" 
                ? `No tasks for ${getSubjectInfo(selectedSubjectFilter).name} on this day. Add one or change the filter.`
                : "Enjoy your free day or add some tasks!"}
            </p>
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <ScrollArea className="flex-grow pr-1 sm:pr-2">
          <div className="space-y-0">
            {hours.map((hour) => (
              <div key={hour} className="flex items-start py-1.5 sm:py-2 border-b last:border-b-0">
                <div className="w-12 sm:w-16 text-[10px] sm:text-xs text-muted-foreground font-medium pt-0.5 sm:pt-1 text-right pr-1.5 sm:pr-2 shrink-0">
                  {hourToDisplayTime(hour)}
                </div>
                <div className="flex-grow pl-1.5 sm:pl-2 border-l min-h-[2.5rem] sm:min-h-[3rem]">
                  {tasksByHour[hour] && tasksByHour[hour].length > 0 ? (
                    tasksByHour[hour].map(task => 
                      <DayViewTaskCard 
                        key={task.id} 
                        task={task} 
                        onToggleStatus={toggleTaskStatus} 
                        onDeleteTask={handleDeleteTask} 
                      />
                    )
                  ) : (
                    <div className="text-[10px] sm:text-xs text-muted-foreground/70 italic h-full flex items-center">No tasks scheduled.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

