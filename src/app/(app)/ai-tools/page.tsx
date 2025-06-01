
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BrainCircuit, BookText, BarChartBig, Sparkles, ListTree } from "lucide-react";

export default function AiToolsPage() {
  const aiTools = [
    {
      title: "AI Syllabus Suggester",
      description: "Get personalized syllabus suggestions for your exams (NEET, UPSC, JEE, etc.).",
      icon: <ListTree className="h-8 w-8 text-primary" />,
      link: "/ai-tools/syllabus-suggester",
      status: "Active",
      actionText: "Use Suggester"
    },
    {
      title: "Study Material Summarizer",
      description: "Quickly grasp key concepts by summarizing your study materials.",
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      link: "/ai-tools/material-summarizer",
      status: "Active",
      actionText: "Use Summarizer"
    },
    {
      title: "Productivity Analysis AI",
      description: "Receive AI-driven insights and recommendations based on your study habits.",
      icon: <BarChartBig className="h-8 w-8 text-primary" />,
      link: "/ai-tools/productivity-analyzer",
      status: "Active",
      actionText: "Analyze Data"
    },
    // Add more AI tools here as planned
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center">
         <BrainCircuit className="mr-3 h-8 w-8 text-primary" /> AI Powered Tools
        </h1>
        <p className="text-lg text-muted-foreground">Leverage artificial intelligence for smarter studying and enhanced productivity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {aiTools.map((tool) => (
          <Card key={tool.title} className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                {tool.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="font-headline text-xl">{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{tool.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild variant={tool.status === "Active" ? "default" : "outline"} className="w-full" disabled={tool.status === "Coming Soon"}>
                <Link href={tool.link || "#"}>
                  {tool.actionText}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="mt-8 p-6 rounded-xl border bg-card text-card-foreground shadow">
          <h2 className="text-xl font-semibold mb-3">How AI Can Help You</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Personalize your study plans based on your learning pace and exam requirements.</li>
            <li>Identify knowledge gaps and suggest relevant topics to focus on.</li>
            <li>Automate tedious tasks like summarizing long texts or generating practice questions.</li>
            <li>Provide insights into your productivity to help you optimize your study habits.</li>
          </ul>
        </div>
    </div>
  );
}
    
