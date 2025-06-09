
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
  MessageSquare,
  Lock,
  HelpCircle,
  ArrowRight,
  Youtube, 
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const iconMap: { [key: string]: LucideIcon } = {
  ListTree: ListTree,
  Sparkles: Sparkles,
  MessageSquare: MessageSquare,
  Lock: Lock,
  HelpCircle: HelpCircle,
  Youtube: Youtube,
  FileText: FileText,
  BrainCircuit: BrainCircuit, 
};

interface AiTool {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof iconMap; 
  iconColorClass?: string;
  cardBgClass?: string; 
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
    cardBgClass: "bg-sky-500/5 dark:bg-sky-800/10",
    link: "/ai-tools/syllabus-suggester",
    status: "Active",
    actionText: "Use Suggester",
  },
  {
    id: "material-summarizer",
    title: "AI Notes Generator",
    description: "Generate structured notes, summaries & quizzes from text or PDFs.",
    iconName: "FileText",
    iconColorClass: "text-amber-500",
    cardBgClass: "bg-amber-500/5 dark:bg-amber-800/10",
    link: "/ai-tools/material-summarizer",
    status: "Active",
    actionText: "Generate Notes",
  },
  {
    id: "youtube-summarizer",
    title: "YouTube Video Summarizer",
    description: "Generate notes, summaries, and quizzes from YouTube video transcripts.",
    iconName: "Youtube", 
    iconColorClass: "text-red-500",
    cardBgClass: "bg-red-500/5 dark:bg-red-800/10",
    link: "/ai-tools/youtube-summarizer",
    status: "Active",
    actionText: "Summarize Video",
  },
  {
    id: "doubt-solver",
    title: "AI Doubt Solver",
    description: "Get instant, context-aware explanations for your academic questions.",
    iconName: "MessageSquare",
    iconColorClass: "text-indigo-500",
    cardBgClass: "bg-indigo-500/5 dark:bg-indigo-800/10",
    link: "/ai-tools/doubt-solver",
    status: "Active",
    actionText: "Ask a Question",
  },
  {
    id: "productivity-analyzer",
    title: "Productivity Analysis AI",
    description: "Unlock your personal AI coach! Requires a 7-day activity streak (study or platform use) to access.",
    iconName: "Lock", 
    iconColorClass: "text-purple-500",
    cardBgClass: "bg-purple-500/5 dark:bg-purple-800/10",
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
    cardBgClass: "bg-green-500/5 dark:bg-green-800/10",
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

      <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {aiTools.map((tool) => {
          const IconComponent = iconMap[tool.iconName] || BrainCircuit; // Fallback icon
          const iconContainerBg = tool.iconColorClass ? tool.iconColorClass.replace('text-', 'bg-') + '/10' : 'bg-primary/10';
          
          return (
            <Card
              key={tool.id}
              className={cn(
                "shadow-lg hover:shadow-2xl transition-all duration-300 ease-out transform hover:-translate-y-1.5 flex flex-col rounded-xl",
                tool.cardBgClass || "bg-card", 
                tool.status === "Coming Soon" && "opacity-70 bg-muted/30",
                tool.status === "Unlockable" && "border-purple-500/30" 
              )}
            >
              <CardHeader className="flex flex-row items-start gap-3 sm:gap-4 space-y-0 pb-3 sm:pb-4 p-4 sm:p-5">
                <div className={cn(
                  "p-2 sm:p-3 rounded-lg",
                  iconContainerBg
                )}>
                  <IconComponent className={cn("h-7 w-7 sm:h-8 sm:w-8", tool.iconColorClass || "text-primary")} />
                </div>
                <div className="flex-1">
                  <CardTitle className="font-headline text-lg sm:text-xl leading-tight">{tool.title}</CardTitle>
                  {tool.status === "Unlockable" && (
                    <Badge className="mt-1.5 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/30">
                        <Lock className="mr-1.5 h-3 w-3"/>Unlockable
                    </Badge>
                  )}
                  {tool.status === "Coming Soon" && <Badge variant="secondary" className="mt-1.5 text-xs px-2 py-0.5">Coming Soon</Badge>}
                  {tool.status === "Active" && (
                    <Badge className="mt-1.5 text-xs px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 hover:bg-green-500/30">
                        Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-4 sm:p-5 pt-0">
                <CardDescription className="text-sm sm:text-base leading-relaxed">{tool.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 sm:p-5">
                <Button
                  asChild
                  variant={tool.status === "Active" ? "default" : "outline"}
                  className="w-full text-sm sm:text-base group py-2.5"
                  disabled={tool.status === "Coming Soon"}
                >
                  <Link href={tool.link || "#"} className={cn(tool.status === "Active" && "bg-primary hover:bg-primary/90")}>
                    {tool.actionText}
                    {tool.status !== "Coming Soon" && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 sm:mt-10 p-4 sm:p-6 rounded-xl border bg-card text-card-foreground shadow-lg">
        <CardHeader className="p-0 pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent" /> How AI Supercharges Your Prep</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="list-disc list-outside space-y-2 text-sm sm:text-base text-muted-foreground pl-5">
            <li><span className="font-medium text-foreground">Personalized Study Plans:</span> Get syllabi tailored to your exam, subjects, and available time.</li>
            <li><span className="font-medium text-foreground">Efficient Learning:</span> Summarize long texts, PDF documents, or video transcripts quickly and grasp key concepts faster.</li>
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
    

    
