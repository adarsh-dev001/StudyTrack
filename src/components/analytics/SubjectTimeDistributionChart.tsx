
'use client';

import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartLegend, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, type Unsubscribe, Timestamp } from 'firebase/firestore';
import { Loader2, PieChartIcon as PieIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from 'react';
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";

// Helper function to assign colors to subjects for the pie chart
const subjectColors: Record<string, string> = {
  physics: "hsl(var(--chart-1))",
  chemistry: "hsl(var(--chart-2))",
  biology: "hsl(var(--chart-3))",
  mathematics: "hsl(var(--chart-4))",
  english: "hsl(var(--chart-5))",
  history: "hsl(var(--chart-1))",
  other: "hsl(var(--chart-2))",
};

const getSubjectColor = (subjectKey: string) => {
  const normalizedKey = subjectKey.toLowerCase();
  return subjectColors[normalizedKey] || "hsl(var(--muted-foreground))";
}

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

interface SubjectTimeDistributionChartProps {
  selectedSubjectFilter?: string | null;
}

export default function SubjectTimeDistributionChart({ selectedSubjectFilter = null }: SubjectTimeDistributionChartProps) {
  const { currentUser } = useAuth();
  const [subjectTimeDataDynamic, setSubjectTimeDataDynamic] = useState<{ subject: string; hours: number; fill: string; }[]>([]);
  const [loadingSubjectData, setLoadingSubjectData] = useState(true);
  const [subjectTimeConfig, setSubjectTimeConfig] = useState<ChartConfig>(subjectTimeConfigBase);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!currentUser || !db) {
      setLoadingSubjectData(false);
      setSubjectTimeDataDynamic([]);
      setSubjectTimeConfig(subjectTimeConfigBase);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    setLoadingSubjectData(true);
    const tasksRef = collection(db, 'users', currentUser.uid, 'plannerTasks');
    let q;

    if (selectedSubjectFilter && selectedSubjectFilter !== "all") {
       // If a subject filter is applied, ensure the query includes it along with the status.
       // Firestore might require a composite index for this: (subject, status).
      q = query(tasksRef, where('subject', '==', selectedSubjectFilter), where('status', '==', 'completed'));
    } else {
      q = query(tasksRef, where('status', '==', 'completed'));
    }


    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
      const processingStartTime = performance.now();
      const subjectHoursMap: Record<string, number> = {};
      querySnapshot.forEach((doc) => {
        const task = doc.data() as { subject: string; duration: number; title: string }; // Assume title might exist for context
        if (task.subject && typeof task.subject === 'string' && typeof task.duration === 'number' && task.duration > 0) {
          const subjectKey = task.subject.toLowerCase();
          subjectHoursMap[subjectKey] = (subjectHoursMap[subjectKey] || 0) + task.duration;
        }
      });
      const dataProcessingTime = performance.now() - processingStartTime;
      console.log(`AnalyticsPage (SubjectTimeDistribution): Data processing took ${dataProcessingTime.toFixed(2)}ms for ${querySnapshot.size} documents.`);

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
      
      setSubjectTimeDataDynamic(newDynamicData);
      setSubjectTimeConfig(newChartConfig);
      setLoadingSubjectData(false);

    }, (error) => {
      console.error("Error fetching completed tasks for SubjectTimeDistributionChart: ", error);
      setLoadingSubjectData(false);
      setSubjectTimeDataDynamic([]);
      setSubjectTimeConfig(subjectTimeConfigBase);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser?.uid, db, selectedSubjectFilter]);

  return (
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
  );
}
