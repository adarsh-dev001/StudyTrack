
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartHorizontalBig, LineChart, PieChart, Lightbulb } from "lucide-react";

export default function AnalyticsPage() {
  const analyticsSections = [
    {
      title: "Weekly Study Hours",
      description: "Track your study hours week by week.",
      icon: <LineChart className="h-8 w-8 text-primary" />,
      status: "Chart Coming Soon"
    },
    {
      title: "Topics Completed",
      description: "Visualize the number of topics you've completed over time.",
      icon: <BarChartHorizontalBig className="h-8 w-8 text-primary" />,
      status: "Chart Coming Soon"
    },
    {
      title: "Subject Time Distribution",
      description: "See how your study time is distributed across different subjects.",
      icon: <PieChart className="h-8 w-8 text-primary" />,
      status: "Chart Coming Soon"
    },
    {
      title: "AI Productivity Insights",
      description: "Get personalized tips and insights from our AI to boost your productivity.",
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      status: "Insights Coming Soon"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Productivity Analytics</h1>
        <p className="text-lg text-muted-foreground">Visualize your study progress and gain insights into your habits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {analyticsSections.map((section) => (
          <Card key={section.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300_transform hover:-translate-y-1 flex flex-col">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                {section.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="font-headline text-xl">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
            <CardContent className="pt-0">
               <div className="text-sm text-center text-muted-foreground font-medium p-2 bg-secondary rounded-md">
                 {section.status}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 rounded-xl border bg-card text-card-foreground shadow">
        <h2 className="text-xl font-semibold mb-3">Understanding Your Analytics</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Monitor your total study time and compare it weekly to build consistency.</li>
          <li>Track how many topics you cover to ensure you're on pace with your syllabus.</li>
          <li>Analyze time spent on each subject to identify areas needing more focus or where you're excelling.</li>
          <li>Leverage AI insights for tailored advice on improving your study effectiveness.</li>
        </ul>
      </div>
    </div>
  );
}
