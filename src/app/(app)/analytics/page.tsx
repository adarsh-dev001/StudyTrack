
'use client';

import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, type DocumentData, type Unsubscribe } from 'firebase/firestore';
import { BarChart3Icon, ExternalLink, Lightbulb, LineChartIcon as LineIcon, Loader2, PieChartIcon as PieIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from 'react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, Legend as RechartsLegend, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";

// Helper function to assign colors to subjects for the pie chart
const subjectColors: Record<string, string> = {
  physics: "hsl(var(--chart-1))",
  chemistry: "hsl(var(--chart-2))",
  biology: "hsl(var(--chart-3))",
  mathematics: "hsl(var(--chart-4))",
  english: "hsl(var(--chart-5))",
  history: "hsl(var(--chart-1))", // Re-using colors for more subjects
  other: "hsl(var(--chart-2))", // Re-using colors
};

const getSubjectColor = (subjectKey: string) => {
  const normalizedKey = subjectKey.toLowerCase();
  return subjectColors[normalizedKey] || "hsl(var(--muted-foreground))"; // Fallback color
}


// Sample Data for Weekly Study Hours (remains sample for now)
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

// Sample Data for Topics Completed (remains sample for now)
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

// Initial static config for Subject Time Distribution (labels for legend)
const subjectTimeConfigBase = {
  hours: { label: "Hours" },
  physics: { label: "Physics", color: getSubjectColor("physics") },
  chemistry: { label: "Chemistry", color: getSubjectColor("chemistry") },
  biology: { label: "Biology", color: getSubjectColor("biology") },
  mathematics: { label: "Mathematics", color: getSubjectColor("mathematics") },
  english: { label: "English", color: getSubjectColor("english") },
  history: { label: "History", color: getSubjectColor("history") },
  other: { label: "Other", color: getSubjectColor("other") },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const [subjectTimeDataDynamic, setSubjectTimeDataDynamic] = useState<{ subject: string; hours: number; fill: string; }[]>([]);
  const [loadingSubjectData, setLoadingSubjectData] = useState(true);
  const [subjectTimeConfig, setSubjectTimeConfig] = useState<ChartConfig>(subjectTimeConfigBase);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);


  useEffect(() => {
    console.log("AnalyticsPage useEffect triggered. Current user:", currentUser?.uid, "DB available:", !!db);
    if (!currentUser || !db) {
      console.log("AnalyticsPage: No current user or db, clearing data and returning.");
      setLoadingSubjectData(false);
      setSubjectTimeDataDynamic([]);
      setSubjectTimeConfig(subjectTimeConfigBase);
      if (unsubscribeRef.current) {
        console.log("AnalyticsPage: Unsubscribing from previous listener (no user/db).");
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    setLoadingSubjectData(true);
    console.log(`AnalyticsPage: Setting up listener for user ${currentUser.uid}`);
    const tasksRef = collection(db, 'users', currentUser.uid, 'plannerTasks');
    const q = query(tasksRef, where('status', '==', 'completed'));

    if (unsubscribeRef.current) {
      console.log("AnalyticsPage: Unsubscribing from previous listener before new setup.");
      unsubscribeRef.current();
    }

    unsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
      console.log(`AnalyticsPage: onSnapshot callback triggered. Docs count: ${querySnapshot.size}`);
      const subjectHoursMap: Record<string, number> = {};
      querySnapshot.forEach((doc) => {
        const task = doc.data() as { subject: string; duration: number; title: string };
        if (task.subject && typeof task.duration === 'number') {
          const subjectKey = task.subject.toLowerCase();
          subjectHoursMap[subjectKey] = (subjectHoursMap[subjectKey] || 0) + task.duration;
        }
      });

      const newDynamicData = Object.entries(subjectHoursMap).map(([subjectKey, hours]) => {
        const subjectLabel = subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1);
        return {
          subject: subjectLabel,
          hours,
          fill: getSubjectColor(subjectKey),
        };
      });

      const newChartConfig: ChartConfig = { hours: { label: "Hours" } };
      newDynamicData.forEach(item => {
        const subjectKey = item.subject.toLowerCase();
        if (!newChartConfig[subjectKey]) {
          newChartConfig[subjectKey] = { label: item.subject, color: item.fill };
        }
      });
      
      // Defer state updates to prevent blocking the main thread
      setTimeout(() => {
        setSubjectTimeDataDynamic(newDynamicData);
        setSubjectTimeConfig(newChartConfig);
        setLoadingSubjectData(false);
        console.log("AnalyticsPage: State updates applied after deferral.");
      }, 0);

    }, (error) => {
      console.error("Error fetching completed tasks for analytics: ", error);
      // Defer error state updates as well
      setTimeout(() => {
        setLoadingSubjectData(false);
        setSubjectTimeDataDynamic([]);
        setSubjectTimeConfig(subjectTimeConfigBase);
      }, 0);
    });

    return () => {
      if (unsubscribeRef.current) {
        console.log("AnalyticsPage: useEffect cleanup - unsubscribing.");
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser, db]);

  return (
    <div className="w-full space-y-6">
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
              <CardDescription>Track planned vs. actual study hours per week. (Sample Data)</CardDescription>
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
              <CardDescription>Visualize target vs. completed topics per month. (Sample Data)</CardDescription>
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

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="bg-primary/10 p-3 rounded-lg">
              <PieIcon className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="font-headline text-xl">Subject Time Distribution</CardTitle>
              <CardDescription>Hours spent on each subject from completed tasks.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[298px]">
            {loadingSubjectData && (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p>Loading subject data...</p>
              </div>
            )}
            {!loadingSubjectData && subjectTimeDataDynamic.length === 0 && (
              <p className="text-muted-foreground text-center">No completed tasks with subject data found. <br />Complete some tasks in the planner to see this chart!</p>
            )}
            {!loadingSubjectData && subjectTimeDataDynamic.length > 0 && (
              <ChartContainer config={subjectTimeConfig} className="h-[250px] w-[300px]">
                <RechartsPieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="subject" />} />
                  <Pie data={subjectTimeDataDynamic} dataKey="hours" nameKey="subject" label={({ subject, percent }) => `${subject}: ${(percent * 100).toFixed(0)}%`}>
                    {subjectTimeDataDynamic.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegend className="mt-4" />} />
                </RechartsPieChart>
              </ChartContainer>
            )}
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
          <li>Monitor your total study time and compare it weekly to build consistency. (Sample data for now)</li>
          <li>Track how many topics you cover to ensure you're on pace with your syllabus. (Sample data for now)</li>
          <li>Analyze time spent on each subject based on your completed tasks to identify areas needing more focus or where you're excelling.</li>
          <li>Leverage AI insights for tailored advice on improving your study effectiveness.</li>
        </ul>
      </div>
    </div>
  );
}
