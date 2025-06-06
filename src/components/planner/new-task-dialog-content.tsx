
"use client"

import type { ChangeEvent } from "react";
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { Priority, Task } from "./planner-types"; 
import { subjects } from "./planner-utils"; 
import { cn } from "@/lib/utils"; // Added missing import

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

interface NewTaskDialogContentProps {
  newTask: Partial<Omit<Task, 'id'>>;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string | number) => void;
  isDayView?: boolean; 
}

function NewTaskDialogContentComponent({ newTask, onInputChange, onSelectChange, isDayView = false }: NewTaskDialogContentProps) {
  return (
    <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-3">
      <div className="grid gap-2">
        <Label htmlFor="title">Task Title <span className="text-destructive">*</span></Label>
        <Input
          id="title" name="title"
          placeholder="e.g., Quantum Mechanics Ch. 3"
          value={newTask.title || ""}
          onChange={onInputChange}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
          <Select
            value={newTask.subject}
            onValueChange={(value) => onSelectChange("subject", value)}
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
            onChange={onInputChange}
          />
        </div>
      </div>
      <div className={cn("grid grid-cols-1 gap-4", !isDayView && "md:grid-cols-2")}>
        {!isDayView && ( 
            <div className="grid gap-2">
            <Label htmlFor="day">Day <span className="text-destructive">*</span></Label>
            <Select
                value={newTask.day?.toString()}
                onValueChange={(value) => onSelectChange("day", parseInt(value))}
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
        )}
        <div className="grid gap-2">
          <Label htmlFor="startHour">Start Time <span className="text-destructive">*</span></Label>
          <Select
            value={newTask.startHour?.toString()}
            onValueChange={(value) => onSelectChange("startHour", parseInt(value))}
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
            onValueChange={(value) => onSelectChange("duration", parseFloat(value))}
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
            onValueChange={(value) => onSelectChange("priority", value as Priority)}
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
          onChange={onInputChange}
          rows={3}
        />
      </div>
    </div>
  );
}

export default React.memo(NewTaskDialogContentComponent);
