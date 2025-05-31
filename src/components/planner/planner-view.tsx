
"use client"

import type { ChangeEvent } from "react";
import React, { useState, useEffect, Suspense } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Plus,
  GripVertical,
  Clock,
  BookOpen,
  CheckCircle2,
  Trash2,
  Loader2
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp
} from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton";

const NewTaskDialogContent = React.lazy(() => import('./new-task-dialog-content'));


// Types
export type Priority = "low" | "medium" | "high"
export type TaskStatus = "pending" | "completed" | "missed"

export interface Task {
  id: string
  userId?: string
  title: string
  subject: string
  topic: string
  description?: string
  duration: number
  priority: Priority
  status: TaskStatus
  day: number
  startHour: number
}

interface PlannerViewProps {
  selectedDate?: Date;
  selectedSubjectFilter?: string | null;
}

const subjects = [
  { id: "physics", name: "Physics", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-300 dark:border-blue-700" },
  { id: "chemistry", name: "Chemistry", color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-300 dark:border-green-700" },
  { id: "biology", name: "Biology", color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-purple-300 dark:border-purple-700" },
  { id: "mathematics", name: "Mathematics", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-300 dark:border-red-700" },
  { id: "english", name: "English", color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700" },
  { id: "history", name: "History", color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 border-orange-300 dark:border-orange-700" },
  { id: "other", name: "Other", color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600" },
];

const getPriorityBadge = (priority: Priority) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">High</Badge>
    case "medium":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium</Badge>
    case "low":
      return <Badge variant="outline" className="bg-green-500 hover:bg-green-600 text-white border-green-600">Low</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

const getSubjectInfo = (subjectId: string) => {
  return subjects.find(s => s.id === subjectId) || subjects.find(s => s.id === "other")!;
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


export function PlannerView({ selectedDate, selectedSubjectFilter }: PlannerViewProps) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState<Partial<Omit<Task, 'id'>>>({
    priority: "medium",
    status: "pending",
    duration: 1,
    day: new Date().getDay(),
    startHour: 9,
    subject: subjects[0].id,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedOver, setDraggedOver] = useState<{ day: number, hour: number } | null>(null)

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const hours = Array.from({ length: 15 }, (_, i) => i + 8)

  useEffect(() => {
    if (!currentUser || !db) {
      setTasks([]);
      return;
    }

    const tasksCollectionRef = collection(db, "users", currentUser.uid, "plannerTasks");
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
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
    });

    return () => unsubscribe();
  }, [currentUser, selectedSubjectFilter, selectedDate]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async () => {
    if (!currentUser || !db) {
      console.error("User not logged in or DB not available");
      return;
    }
    if (!newTask.title || !newTask.subject) {
      console.error("Title and subject are required");
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
      day: Number(newTask.day) || 0,
      startHour: Number(newTask.startHour) || 9,
    };

    try {
      const tasksCollectionRef = collection(db, "users", currentUser.uid, "plannerTasks");
      await addDoc(tasksCollectionRef, taskToSave);
      setNewTask({
        title: "",
        topic: "",
        description: "",
        priority: "medium",
        status: "pending",
        duration: 1,
        day: new Date().getDay(),
        startHour: 9,
        subject: subjects[0].id,
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating task: ", error);
    }
  }

  const handleDragStart = (task: Task, e: React.DragEvent) => {
    setDraggedTask(task);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id);
    }
  }

  const handleDragOver = (day: number, hour: number, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move";
    setDraggedOver({ day, hour })
  }

  const handleDragLeave = (e: React.DragEvent) => {
    setDraggedOver(null);
  }

  const handleDrop = async (day: number, hour: number) => {
    if (!currentUser || !db || !draggedTask || !draggedTask.id) return;

    const taskDocRef = doc(db, "users", currentUser.uid, "plannerTasks", draggedTask.id);
    try {
      await updateDoc(taskDocRef, { day, startHour: hour });
    } catch (error) {
      console.error("Error updating task position: ", error);
    }
    setDraggedTask(null)
    setDraggedOver(null)
  }

  const toggleTaskStatus = async (taskId: string) => {
    if (!currentUser || !db) return;
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const newStatus = taskToUpdate.status === "completed" ? "pending" : "completed";
    const taskDocRef = doc(db, "users", currentUser.uid, "plannerTasks", taskId);
    try {
      await updateDoc(taskDocRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status: ", error);
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser || !db) return;
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const taskDocRef = doc(db, "users", currentUser.uid, "plannerTasks", taskId);
    try {
      await deleteDoc(taskDocRef);
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  }

  const renderTask = (task: Task) => {
    const subjectInfo = getSubjectInfo(task.subject);

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(task, e)}
        className={cn(
          "rounded-md p-2 mb-1.5 cursor-move shadow-sm border relative group",
          task.status === "completed" ? "opacity-60 bg-opacity-70" : "opacity-100",
          subjectInfo.color,
          "hover:shadow-md transition-shadow"
        )}
        style={{ minHeight: `${Math.max(1, task.duration) * 2.0}rem` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 overflow-hidden pr-1">
            <div className="flex items-center">
              <GripVertical className="h-4 w-4 mr-1 opacity-50 shrink-0 group-hover:opacity-70" />
              <h4 className="font-semibold text-sm truncate" title={task.title}>{task.title}</h4>
            </div>
            <div className="text-xs mt-0.5 mb-1 opacity-80">
              <span className="font-medium">{subjectInfo.name}</span>
              {task.topic && <span className="truncate" title={task.topic}> • {task.topic}</span>}
            </div>
            <div className="flex items-center text-xs opacity-70">
              <Clock className="h-3 w-3 mr-1 shrink-0" />
              <span>{task.duration} {task.duration === 1 ? 'hr' : 'hrs'}</span>
            </div>
          </div>
          <div className="flex flex-col items-center ml-1 space-y-0.5">
            <button
              onClick={() => toggleTaskStatus(task.id)}
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
              onClick={() => handleDeleteTask(task.id)}
              className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-destructive-foreground"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700 dark:hover:text-red-400" />
            </button>
          </div>
        </div>
        {task.priority && (
          <div className="mt-1">
            {getPriorityBadge(task.priority)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-1 h-full flex flex-col">
      {!currentUser && (
         <Card className="border-dashed flex-grow">
          <CardContent className="pt-6 text-center flex flex-col justify-center items-center h-full">
            <div className="mx-auto rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Login to Plan Your Studies</h3>
            <p className="text-muted-foreground mb-4">
              Please login or sign up to start organizing your study schedule.
            </p>
          </CardContent>
        </Card>
      )}
      {currentUser && tasks.length === 0 && (
        <Card className="border-dashed flex-grow">
          <CardContent className="pt-6 text-center flex flex-col justify-center items-center h-full">
            <div className="mx-auto rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Tasks Yet</h3>
            <p className="text-muted-foreground mb-4">
              {selectedSubjectFilter && selectedSubjectFilter !== "all"
                ? `No tasks found for ${getSubjectInfo(selectedSubjectFilter).name}. Try a different filter or add a new task.`
                : "Click 'Add Task' to organize your study schedule."
              }
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </CardContent>
        </Card>
      )}

      {currentUser && (tasks.length > 0 || (selectedSubjectFilter && selectedSubjectFilter !== "all")) && (
        <div className="overflow-auto flex-grow pb-2 -mx-1">
          <div className="grid grid-cols-[auto_repeat(7,minmax(130px,1fr))] gap-1 min-w-[950px]">
            <div className="sticky left-0 bg-background z-10">
              <div className="h-10"></div>
              {hours.map(hour => (
                <div key={`time-${hour}`} className="h-20 flex items-center justify-center border-r pr-1 text-xs font-medium text-muted-foreground">
                  <span>
                    {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? 'am' : 'pm'}
                  </span>
                </div>
              ))}
            </div>

            {days.map((dayLabel, dayIndex) => (
              <div key={dayLabel}>
                <div className="h-10 flex items-center justify-center font-semibold text-sm sticky top-0 bg-background z-10 border-b">
                  {dayLabel}
                </div>
                {hours.map(hour => {
                  const tasksInSlot = tasks.filter(
                    task => task.day === dayIndex && task.startHour === hour
                  );
                  const isOver = draggedOver?.day === dayIndex && draggedOver?.hour === hour;

                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={cn(
                        "h-20 border rounded-md p-0.5 relative overflow-hidden",
                        isOver ? "bg-accent/70 ring-1 ring-primary" : "bg-muted/20 hover:bg-muted/40",
                        tasksInSlot.length > 0 ? "border-border/60" : "border-dashed border-border/40"
                      )}
                      onDragOver={(e) => handleDragOver(dayIndex, hour, e)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(dayIndex, hour)}
                    >
                      <ScrollArea className="h-full">
                        <div className="p-0.5">
                        {tasksInSlot.length > 0 ?
                          tasksInSlot.map(task => renderTask(task)) :
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
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-2 shrink-0">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!currentUser}>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Study Task</DialogTitle>
              <DialogDescription>
                Fill in the details for your new study task.
              </DialogDescription>
            </DialogHeader>
            <Suspense fallback={<NewTaskDialogFallback />}>
                <NewTaskDialogContent
                    newTask={newTask}
                    onInputChange={handleInputChange}
                    onSelectChange={handleSelectChange}
                />
            </Suspense>
            <DialogFooter className="mt-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTask} disabled={!currentUser || !newTask.title || !newTask.subject}>Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {currentUser && tasks.length > 0 && (
        <Card className="mt-4 shrink-0">
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
