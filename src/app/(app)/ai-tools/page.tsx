
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BrainCircuit,
  ListTree,
  Sparkles,
  MessageSquareQuestion, // Direct import
  Lock,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define an icon map based on user's working example structure
// Keys here MUST EXACTLY match iconName strings in aiTools array.
// Values are the imported Lucide components.
const iconMap: { [key: string]: LucideIcon } = {
  ListTree: ListTree,
  Sparkles: Sparkles, // Key matches imported name
  MessageSquareQuestion: MessageSquareQuestion, // Key matches imported name
  Lock: Lock, // Key matches imported name
  HelpCircle: HelpCircle,
};

interface AiTool {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof iconMap; // iconName must be a key defined in iconMap
  iconColorClass?: string;
  link: string;
  status: "Active" | "Coming Soon" | "Unlockable";
  actionText: string;
}

const aiTools: AiTool[] = [
  {
    id: "syllabus-suggester",
    title: "AI Syllabus Suggester",
    description: "Get personalized syllabus suggestions for your exams (NEET, UPSC, JEE, etc.).",
    iconName: "ListTree", 
    iconColorClass: "text-sky-500",
    link: "/ai-tools/syllabus-suggester",
    status: "Active",
    actionText: "Use Suggester",
  },
  {
    id: "material-summarizer",
    title: "Study Material Summarizer",
    description: "Quickly grasp key concepts by summarizing your study materials.",
    iconName: "Sparkles", // Updated to match direct import/key
    iconColorClass: "text-amber-500",
    link: "/ai-tools/material-summarizer",
    status: "Active",
    actionText: "Use Summarizer",
  },
  {
    id: "doubt-solver",
    title: "AI Doubt Solver",
    description: "Get instant, context-aware explanations for your academic questions.",
    iconName: "MessageSquareQuestion", // Updated to match direct import/key
    iconColorClass: "text-indigo-500",
    link: "/ai-tools/doubt-solver",
    status: "Active",
    actionText: "Ask a Question",
  },
  {
    id: "productivity-analyzer",
    title: "Productivity Analysis AI",
    description: "Unlock AI-driven insights! Requires a 7-day activity streak to access.",
    iconName: "Lock", // Updated to match direct import/key
    iconColorClass: "text-purple-500",
    link: "/ai-tools/productivity-analyzer",
    status: "Unlockable",
    actionText: "Check Status",
  },
  {
    id: "smart-quiz",
    title: "SmartQuiz AI",
    description: "Generate custom quizzes on any topic, tailored to exam type and difficulty.",
    iconName: "HelpCircle", 
    iconColorClass: "text-green-500",
    link: "/ai-tools/smart-quiz",
    status: "Active",
    actionText: "Create Quiz",
  },
];

export default function AiToolsPage() {
  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <BrainCircuit className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> AI Powered Tools
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">Your Study Companions: Leverage smart tools to supercharge your prep.</p>
      </header>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {aiTools.map((tool) => {
          const IconComponent = iconMap[tool.iconName];
          if (!IconComponent) {
            console.error(`[Client] Icon not found in map: ${tool.iconName}`);
            return <div key={tool.id}>Error: Icon {tool.iconName} not found. Check iconMap.</div>;
          }
          return (
            <Card
              key={tool.id}
              className={cn(
                "shadow-lg hover:shadow-2xl transition-all duration-300 ease-out transform hover:-translate-y-1.5 flex flex-col",
                tool.status === "Coming Soon" && "opacity-70 bg-muted/30",
                tool.status === "Unlockable" && "border-dashed border-primary/50 bg-primary/5"
              )}
            >
              <CardHeader className="flex flex-row items-start gap-3 sm:gap-4 space-y-0 pb-2 sm:pb-3 p-4 sm:p-6">
                <div className={cn(
                  "p-2 sm:p-3 rounded-lg",
                  tool.status === "Unlockable" ? "bg-primary/20" : "bg-primary/10"
                )}>
                  <IconComponent className={cn("h-6 w-6 sm:h-8 sm:w-8", tool.iconColorClass || "text-primary")} />
                </div>
                <div className="flex-1">
                  <CardTitle className="font-headline text-lg sm:text-xl">{tool.title}</CardTitle>
                  {tool.status === "Unlockable" && <Badge variant="outline" className="mt-1 text-xs bg-background text-primary border-primary">Unlockable</Badge>}
                  {tool.status === "Coming Soon" && <Badge variant="secondary" className="mt-1 text-xs">Coming Soon</Badge>}
                  {tool.status === "Active" && <Badge variant="default" className="mt-1 text-xs bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 hover:bg-green-500/30">Active</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base">{tool.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 sm:p-6">
                <Button
                  asChild
                  variant={tool.status === "Active" ? "default" : "outline"}
                  className="w-full text-sm sm:text-base group"
                  disabled={tool.status === "Coming Soon"}
                >
                  <Link href={tool.link || "#"}>
                    {tool.actionText}
                    {tool.status !== "Coming Soon" && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-xl border bg-card text-card-foreground shadow-lg">
        <CardHeader className="p-0 pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent" /> How AI Supercharges Your Prep</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="list-disc list-outside space-y-2 text-sm sm:text-base text-muted-foreground pl-5">
            <li><span className="font-medium text-foreground">Personalized Study Plans:</span> Get syllabi tailored to your exam, subjects, and available time.</li>
            <li><span className="font-medium text-foreground">Efficient Learning:</span> Summarize long texts quickly and grasp key concepts faster.</li>
            <li><span className="font-medium text-foreground">Targeted Assessment:</span> Generate custom quizzes to test your knowledge on specific topics and difficulties.</li>
            <li><span className="font-medium text-foreground">Productivity Insights:</span> Understand your study habits and get AI-driven advice to optimize your focus.</li>
            <li><span className="font-medium text-foreground">Instant Doubt Resolution:</span> Get clear explanations for academic questions, personalized to your context.</li>
            <li><span className="font-medium text-foreground">Motivational Boost:</span> Stay engaged with AI-driven recommendations and progress tracking.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
