
"use client"

import type { ChangeEvent } from "react";
import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  GripVertical, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Trash2
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
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
  onSnapshot,
  Timestamp // Added for potential future use with specific dates
} from "firebase/firestore"

// Types
type Priority = "low" | "medium" | "high"
type TaskStatus = "pending" | "completed" | "missed" // Missed status not fully used yet

interface Task {
  id: string // Firestore document ID
  userId?: string // To associate task with user
  title: string
  subject: string
  topic: string
  description?: string
  duration: number // in hours
  priority: Priority
  status: TaskStatus
  day: number // 0-6 (Sunday to Saturday for generic week view)
  startHour: number // 0-23
  // taskDate?: Timestamp; // For specific date planning - future enhancement
}

// Sample subject data with colors - can be moved to a config file or fetched
const subjects = [
  { id: "physics", name: "Physics", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-300 dark:border-blue-700" },
  { id: "chemistry", name: "Chemistry", color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-300 dark:border-green-700" },
  { id: "biology", name: "Biology", color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-purple-300 dark:border-purple-700" },
  { id: "mathematics", name: "Mathematics", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-300 dark:border-red-700" },
  { id: "english", name: "English", color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700" },
  { id: "history", name: "History", color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 border-orange-300 dark:border-orange-700" },
  { id: "other", name: "Other", color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600" },
]

// Helper functions
const getPriorityBadge = (priority: Priority) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">High Priority</Badge>
    case "medium":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium Priority</Badge>
    case "low":
      return <Badge variant="outline" className="bg-green-500 hover:bg-green-600 text-white border-green-600">Low Priority</Badge>
    default:
      return <Badge variant="secondary">Unknown Priority</Badge>;
  }
}

const getSubjectInfo = (subjectId: string) => {
  return subjects.find(s => s.id === subjectId) || subjects.find(s => s.id === "other")!;
}


export function PlannerView() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState<Partial<Omit<Task, 'id'>>>({
    priority: "medium",
    status: "pending",
    duration: 1,
    day: new Date().getDay(), // Default to current day of week
    startHour: 9,
    subject: subjects[0].id, // Default to first subject
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedOver, setDraggedOver] = useState<{ day: number, hour: number } | null>(null)
  
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const hours = Array.from({ length: 15 }, (_, i) => i + 8) // 8 AM to 10 PM (22:00)

  useEffect(() => {
    if (!currentUser || !db) return;

    const tasksCollectionRef = collection(db, "users", currentUser.uid, "plannerTasks");
    const q = query(tasksCollectionRef); // Add orderBy here if needed, e.g., orderBy("startHour")

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      // Handle error appropriately, e.g., show a toast
    });

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, [currentUser]);
  
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
      // Show toast: "You must be logged in to create tasks."
      return;
    }
    if (!newTask.title || !newTask.subject) {
      console.error("Title and subject are required");
      // Show toast: "Title and subject are required."
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
      // taskDate: newTask.taskDate || Timestamp.now() // Example for future date-specific tasks
    };
    
    try {
      const tasksCollectionRef = collection(db, "users", currentUser.uid, "plannerTasks");
      await addDoc(tasksCollectionRef, taskToSave);
      setNewTask({ // Reset form
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
      // Show toast: "Failed to create task."
    }
  }
  
  const handleDragStart = (task: Task, e: React.DragEvent) => {
    setDraggedTask(task);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id); // Necessary for Firefox
    }
  }
  
  const handleDragOver = (day: number, hour: number, e: React.DragEvent) => {
    e.preventDefault() // Allow drop
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
      // Optimistic update handled by onSnapshot, or:
      // setTasks(prevTasks => prevTasks.map(task => 
      //   task.id === draggedTask.id ? { ...task, day, startHour: hour } : task
      // ));
    } catch (error) {
      console.error("Error updating task position: ", error);
      // Show toast
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
      // Show toast
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
      // Show toast
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
          "rounded-md p-2.5 mb-1.5 cursor-move shadow-sm border relative",
          task.status === "completed" ? "opacity-60 bg-opacity-70" : "opacity-100",
          subjectInfo.color,
          "hover:shadow-md transition-shadow"
        )}
        style={{ minHeight: `${Math.max(1, task.duration) * 2.5}rem` }} // Basic height based on duration
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center">
              <GripVertical className="h-4 w-4 mr-1 opacity-50 shrink-0" />
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
          <div className="flex flex-col items-center ml-1 space-y-1">
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
          <div className="mt-1.5">
            {getPriorityBadge(task.priority)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">
      {tasks.length === 0 && !currentUser && (
         <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
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
      {tasks.length === 0 && currentUser && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Start Planning Your Study Sessions</h3>
            <p className="text-muted-foreground mb-4">
              Click "Add Task" to organize your study schedule and track your progress.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Task
            </Button>
          </CardContent>
        </Card>
      )}
      
      {currentUser && (
        <div className="overflow-x-auto pb-4 -mx-1">
          <div className="grid grid-cols-[auto_repeat(7,minmax(120px,1fr))] gap-1.5 min-w-[900px]">
            {/* Time column */}
            <div className="sticky left-0 bg-background z-10">
              <div className="h-10"></div> {/* Empty cell for alignment */}
              {hours.map(hour => (
                <div key={`time-${hour}`} className="h-24 flex items-center justify-center border-r pr-1 text-xs font-medium text-muted-foreground">
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
                        "h-24 border rounded-md p-0.5 relative overflow-hidden", // Changed p-1 to p-0.5
                        isOver ? "bg-accent ring-2 ring-primary" : "bg-muted/20 hover:bg-muted/50",
                        tasksInSlot.length > 0 ? "border-border" : "border-dashed border-border/50"
                      )}
                      onDragOver={(e) => handleDragOver(dayIndex, hour, e)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(dayIndex, hour)}
                    >
                      <ScrollArea className="h-full">
                        <div className="p-0.5"> {/* Added padding for ScrollArea content */}
                        {tasksInSlot.length > 0 ? 
                          tasksInSlot.map(task => renderTask(task)) :
                          (isOver && draggedTask) && (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                              Drop here
                            </div>
                          )
                        }
                        </div>
                      </ScrollArea>
                       {tasksInSlot.length === 0 && !isOver && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                           {/* Can add a subtle + icon here if needed for empty slots */}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end mt-4">
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
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title" name="title"
                  placeholder="e.g., Quantum Mechanics Ch. 3"
                  value={newTask.title || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
                  <Select
                    value={newTask.subject}
                    onValueChange={(value) => handleSelectChange("subject", value)}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic / Chapter</Label>
                  <Input
                    id="topic" name="topic"
                    placeholder="e.g., Wave Functions"
                    value={newTask.topic || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="day">Day <span className="text-destructive">*</span></Label>
                  <Select
                    value={newTask.day?.toString()}
                    onValueChange={(value) => handleSelectChange("day", parseInt(value))}
                  >
                    <SelectTrigger id="day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startHour">Start Time <span className="text-destructive">*</span></Label>
                  <Select
                    value={newTask.startHour?.toString()}
                    onValueChange={(value) => handleSelectChange("startHour", parseInt(value))}
                  >
                    <SelectTrigger id="startHour">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (hours) <span className="text-destructive">*</span></Label>
                  <Select
                    value={newTask.duration?.toString()}
                    onValueChange={(value) => handleSelectChange("duration", parseFloat(value))}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0.5, 1, 1.5, 2, 2.5, 3, 4].map(d => (
                        <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority <span className="text-destructive">*</span></Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => handleSelectChange("priority", value as Priority)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description" name="description"
                  placeholder="Add more details, notes, or specific goals..."
                  value={newTask.description || ""}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTask} disabled={!currentUser}>Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {currentUser && tasks.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base font-semibold">Subject Color Legend</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {subjects.map(subject => (
                <div 
                  key={subject.id}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs flex items-center border", // ensure border is applied
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

