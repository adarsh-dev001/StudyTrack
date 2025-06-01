
"use client";

import type { ChangeEvent } from "react";
import React, { useState, useEffect, Suspense } from "react";
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
} from "firebase/firestore";
import { format } from "date-fns";
import type { Task, Priority } from "./planner-types";
import { subjects, getPriorityBadge, getSubjectInfo, hourToDisplayTime } from "./planner-utils";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the dialog content
const NewTaskDialogContent = React.lazy(() => import('./new-task-dialog-content'));

interface DayViewProps {
  selectedDate: Date;
  selectedSubjectFilter: string | null;
}

function NewTaskDialogFallback() {
    return (
        <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-3">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            <Skeleton className="h-20 w-full" />
        </div>
    );
}

export default function DayView({ selectedDate, selectedSubjectFilter }: DayViewProps) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [newTask, setNewTask] = useState<Partial<Omit<Task, "id">>>({
    priority: "medium",
    status: "pending",
    duration: 1,
    day: selectedDate.getDay(),
    startHour: 9, // Default start hour
    subject: subjects[0].id, // Default subject
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  useEffect(() => {
    // Update the default day for new tasks when selectedDate changes
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
    const queries = [where("day", "==", dayOfWeek)];

    if (selectedSubjectFilter && selectedSubjectFilter !== "all") {
      queries.push(where("subject", "==", selectedSubjectFilter));
    }
    
    const q = query(tasksCollectionRef, ...queries);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      // Sort tasks by startHour for consistent display
      fetchedTasks.sort((a, b) => a.startHour - b.startHour);
      setTasks(fetchedTasks);
      setIsLoadingTasks(false);
    }, (error) => {
      console.error("Error fetching tasks for DayView: ", error);
      setIsLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedDate, selectedSubjectFilter]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async () => {
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
      day: selectedDate.getDay(), // Ensure day is from selectedDate
      startHour: Number(newTask.startHour),
    };

    try {
      await addDoc(collection(db, "users", currentUser.uid, "plannerTasks"), taskToSave);
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
  };

  const toggleTaskStatus = async (taskId: string) => {
    if (!currentUser || !db) return;
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const newStatus = taskToUpdate.status === "completed" ? "pending" : "completed";
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "plannerTasks", taskId), { status: newStatus });
    } catch (error) {
      console.error("Error updating task status: ", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser || !db) return;
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "plannerTasks", taskId));
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };

  const renderTaskCard = (task: Task) => {
    const subjectInfo = getSubjectInfo(task.subject);
    return (
      <Card key={task.id} className={cn("mb-3 shadow-md border", subjectInfo.color, task.status === "completed" ? "opacity-60 line-through" : "")}>
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex justify-between items-start">
            <CardTitle className={cn("text-base font-semibold leading-tight", subjectInfo.textColor)} title={task.title}>
              {task.title}
            </CardTitle>
            <div className="flex items-center space-x-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleTaskStatus(task.id)} title={task.status === "completed" ? "Mark pending" : "Mark completed"}>
                {task.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <CheckCircle2 className="h-4 w-4 opacity-50 hover:opacity-100" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteTask(task.id)} title="Delete task">
                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
              </Button>
            </div>
          </div>
          <div className={cn("text-xs opacity-90", subjectInfo.textColor)}>
            <span className="font-medium">{subjectInfo.name}</span>
            {task.topic && <span className="ml-1"> - {task.topic}</span>}
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 text-xs">
          {task.description && <p className={cn("mb-2 opacity-80", subjectInfo.textColor)}>{task.description}</p>}
          <div className="flex justify-between items-center">
            <div className={cn("flex items-center opacity-80", subjectInfo.textColor)}>
              <Clock className="h-3 w-3 mr-1" />
              <span>{hourToDisplayTime(task.startHour)} ({task.duration} {task.duration === 1 ? "hr" : "hrs"})</span>
            </div>
            {getPriorityBadge(task.priority)}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingTasks) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading tasks for {format(selectedDate, "EEEE, MMM d")}...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card className="border-dashed flex-grow flex flex-col items-center justify-center min-h-[400px] bg-muted/20">
        <CardContent className="pt-6 text-center p-6">
             <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Login to Plan Your Day</h3>
          <p className="text-muted-foreground">Please login to view and manage your daily study schedule.</p>
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
    <div className="flex-grow flex flex-col p-1">
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-xl font-bold text-foreground">
          Tasks for: {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Task for {format(selectedDate, "EEEE")}</DialogTitle>
              <DialogDescription>
                Fill in the details for your new study task for {format(selectedDate, "MMMM d")}. Required fields are marked with <span className="text-destructive">*</span>.
              </DialogDescription>
            </DialogHeader>
            <Suspense fallback={<NewTaskDialogFallback />}>
                <NewTaskDialogContent
                    newTask={{...newTask, day: selectedDate.getDay() }} // Ensure day is correctly set
                    onInputChange={handleInputChange}
                    onSelectChange={handleSelectChange}
                />
            </Suspense>
            <DialogFooter className="mt-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTask} disabled={!newTask.title || !newTask.subject || newTask.startHour === undefined || newTask.duration === undefined}>Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 && !isLoadingTasks && (
        <Card className="border-dashed flex-grow flex flex-col items-center justify-center min-h-[300px] bg-muted/20">
          <CardContent className="text-center p-6">
            <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1 text-foreground">No tasks for {format(selectedDate, "EEEE")}.</h3>
            <p className="text-muted-foreground text-sm">
              {selectedSubjectFilter && selectedSubjectFilter !== "all" 
                ? `No tasks for ${getSubjectInfo(selectedSubjectFilter).name} on this day. Add one or change the filter.`
                : "Enjoy your free day or add some tasks!"}
            </p>
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <ScrollArea className="flex-grow">
          <div className="space-y-0 pr-3">
            {hours.map((hour) => (
              <div key={hour} className="flex items-start py-2 border-b last:border-b-0">
                <div className="w-20 text-xs text-muted-foreground font-medium pt-1 text-right pr-3 shrink-0">
                  {hourToDisplayTime(hour)}
                </div>
                <div className="flex-grow pl-3 border-l min-h-[3rem]">
                  {tasksByHour[hour] && tasksByHour[hour].length > 0 ? (
                    tasksByHour[hour].map(task => renderTaskCard(task))
                  ) : (
                    <div className="text-xs text-muted-foreground/70 italic h-full flex items-center">No tasks scheduled.</div>
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

