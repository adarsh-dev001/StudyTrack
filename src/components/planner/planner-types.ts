
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "completed" | "missed";

export interface Task {
  id: string;
  userId?: string;
  title: string;
  subject: string;
  topic?: string; // Made topic optional to align with NewTaskDialogContent
  description?: string;
  duration: number;
  priority: Priority;
  status: TaskStatus;
  day: number; // 0 (Sun) to 6 (Sat)
  startHour: number; // 0 to 23
}
