
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, BookText, BarChartBig } from "lucide-react";

export default function AiToolsPage() {
  const aiTools = [
    {
      title: "AI Syllabus Suggester",
      description: "Get personalized syllabus suggestions for your exams (NEET, UPSC, JEE, etc.).",
      icon: <BookText className="h-8 w-8 text-primary" />,
      link: "/ai-tools/syllabus-suggester", // Example link, adjust as needed
      status: "Coming Soon"
    },
    {
      title: "Study Material Summarizer",
      description: "Quickly grasp key concepts by summarizing your study materials.",
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      link: "/ai-tools/material-summarizer",
      status: "Coming Soon"
    },
    {
      title: "Productivity Analysis AI",
      description: "Receive AI-driven insights and recommendations based on your study habits.",
      icon: <BarChartBig className="h-8 w-8 text-primary" />,
      link: "/ai-tools/productivity-analyzer", // Or link to analytics page if more suitable
      status: "Coming Soon"
    },
    // Add more AI tools here as planned
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">AI Tools</h1>
        <p className="text-lg text-muted-foreground">Leverage artificial intelligence for smarter studying and enhanced productivity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {aiTools.map((tool) => (
          <Card key={tool.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300_transform hover:-translate-y-1 flex flex-col">
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
            <CardContent className="pt-0">
               {/* In a real scenario, this would be a Link component from Next.js
                   <Button asChild variant="outline" className="w-full" disabled={tool.status === "Coming Soon"}>
                     <Link href={tool.link || "#"}>
                       {tool.status === "Coming Soon" ? "Coming Soon" : "Use Tool"}
                     </Link>
                   </Button>
               */}
               <div className="text-sm text-center text-muted-foreground font-medium p-2 bg-secondary rounded-md">
                 {tool.status}
               </div>
            </CardContent>
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
