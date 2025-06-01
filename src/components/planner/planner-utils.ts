
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority } from "./planner-types";

export const subjects = [
  { id: "physics", name: "Physics", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-300 dark:border-blue-700", textColor: "text-blue-800 dark:text-blue-100" },
  { id: "chemistry", name: "Chemistry", color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-300 dark:border-green-700", textColor: "text-green-800 dark:text-green-100" },
  { id: "biology", name: "Biology", color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-purple-300 dark:border-purple-700", textColor: "text-purple-800 dark:text-purple-100" },
  { id: "mathematics", name: "Mathematics", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-300 dark:border-red-700", textColor: "text-red-800 dark:text-red-100" },
  { id: "english", name: "English", color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700", textColor: "text-yellow-800 dark:text-yellow-100" },
  { id: "history", name: "History", color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 border-orange-300 dark:border-orange-700", textColor: "text-orange-800 dark:text-orange-100" },
  { id: "other", name: "Other", color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600", textColor: "text-gray-800 dark:text-gray-100" },
];

export const getPriorityBadge = (priority: Priority) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium</Badge>;
    case "low":
      return <Badge variant="outline" className="bg-green-500 hover:bg-green-600 text-white border-green-600">Low</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export const getSubjectInfo = (subjectId: string) => {
  return subjects.find(s => s.id === subjectId) || subjects.find(s => s.id === "other")!;
};

export const hourToDisplayTime = (hour: number) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${ampm}`;
};
