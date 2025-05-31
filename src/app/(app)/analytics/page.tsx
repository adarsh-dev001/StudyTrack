
'use client';

import { Bar, Line, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, LineChart as RechartsLineChart, BarChart as RechartsBarChart, PieChart as RechartsPieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, type ChartConfig } from "@/components/ui/chart";
import { LineChartIcon as LineIcon, BarChart3Icon, PieChartIcon as PieIcon, Lightbulb, ExternalLink } from "lucide-react"; // Renamed to avoid conflict
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Sample Data for Weekly Study Hours
const weeklyStudyHoursData = [
  { week: "W1", planned: 10, actual: 8 },
  { week: "W2", planned: 12, actual: 11 },
  { week: "W3", planned: 15, actual: 15 },
  { week: "W4", planned: 14, actual: 10 },
  { week: "W5", planned: 16, actual: 17 },
  { week: "W6", planned: 18, actual: 16 },
];

const weeklyStudyHoursConfig = {
  planned: { label: "Planned Hours", color: "hsl(var(--chart-1))" },
  actual: { label: "Actual Hours", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// Sample Data for Topics Completed
const topicsCompletedData = [
  { month: "Jan", target: 20, completed: 18 },
  { month: "Feb", target: 22, completed: 20 },
  { month: "Mar", target: 25, completed: 25 },
  { month: "Apr", target: 20, completed: 15 },
  { month: "May", target: 24, completed: 26 },
  { month: "Jun", target: 28, completed: 25 },
];

const topicsCompletedConfig = {
  target: { label: "Target Topics", color: "hsl(var(--chart-3))" },
  completed: { label: "Completed Topics", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

// Sample Data for Subject Time Distribution
const subjectTimeData = [
  { subject: "Physics", hours: 120, fill: "hsl(var(--chart-1))" },
  { subject: "Chemistry", hours: 90, fill: "hsl(var(--chart-2))" },
  { subject: "Biology", hours: 150, fill: "hsl(var(--chart-3))" },
  { subject: "Math", hours: 100, fill: "hsl(var(--chart-4))" },
  { subject: "Other", hours: 60, fill: "hsl(var(--chart-5))" },
];
const subjectTimeConfig = {
  hours: { label: "Hours" },
  physics: { label: "Physics", color: "hsl(var(--chart-1))" },
  chemistry: { label: "Chemistry", color: "hsl(var(--chart-2))" },
  biology: { label: "Biology", color: "hsl(var(--chart-3))" },
  math: { label: "Math", color: "hsl(var(--chart-4))" },
  other: { label: "Other", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Productivity Analytics</h1>
        <p className="text-lg text-muted-foreground">Visualize your study progress and gain insights into your habits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="bg-primary/10 p-3 rounded-lg">
              <LineIcon className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="font-headline text-xl">Weekly Study Hours</CardTitle>
              <CardDescription>Track planned vs. actual study hours per week.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyStudyHoursConfig} className="h-[250px] w-full">
              <RechartsLineChart data={weeklyStudyHoursData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line dataKey="planned" type="monotone" stroke="var(--color-planned)" strokeWidth={2} dot={false} />
                <Line dataKey="actual" type="monotone" stroke="var(--color-actual)" strokeWidth={2} dot={false} />
                <ChartLegend content={<ChartLegend />} />
              </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="bg-primary/10 p-3 rounded-lg">
              <BarChart3Icon className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="font-headline text-xl">Topics Completed</CardTitle>
              <CardDescription>Visualize target vs. completed topics per month.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={topicsCompletedConfig} className="h-[250px] w-full">
              <RechartsBarChart data={topicsCompletedData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="target" fill="var(--color-target)" radius={4} />
                <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                <ChartLegend content={<ChartLegend />} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2"> {/* New row for Pie Chart and AI Insights */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="bg-primary/10 p-3 rounded-lg">
              <PieIcon className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="font-headline text-xl">Subject Time Distribution</CardTitle>
              <CardDescription>Hours spent on each subject (sample data).</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={subjectTimeConfig} className="h-[250px] w-[300px]">
              <RechartsPieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="subject" />} />
                <Pie data={subjectTimeData} dataKey="hours" nameKey="subject" labelLine={false} label={({ subject, percent }) => `${subject}: ${(percent * 100).toFixed(0)}%`}>
                  {subjectTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegend className="mt-4"/>} />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg flex flex-col">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Lightbulb className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="font-headline text-xl">AI Productivity Insights</CardTitle>
              <CardDescription>Get personalized tips from our AI to boost productivity.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">
              Analyze your study data for personalized recommendations.
            </p>
            <Button asChild>
              <Link href="/ai-tools/productivity-analyzer">
                Analyze My Data <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
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

