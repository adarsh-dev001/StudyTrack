
'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, Lightbulb } from "lucide-react";
import ChartCardSkeleton from '@/components/analytics/ChartCardSkeleton'; // Adjusted import path

const WeeklyStudyHoursChart = React.lazy(() => import('@/components/analytics/WeeklyStudyHoursChart'));
const TopicsCompletedChart = React.lazy(() => import('@/components/analytics/TopicsCompletedChart'));
const SubjectTimeDistributionChart = React.lazy(() => import('@/components/analytics/SubjectTimeDistributionChart'));


export default function AnalyticsPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Productivity Analytics</h1>
        <p className="text-lg text-muted-foreground">Visualize your study progress and gain insights into your habits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Suspense fallback={<ChartCardSkeleton />}>
          <WeeklyStudyHoursChart />
        </Suspense>
        <Suspense fallback={<ChartCardSkeleton />}>
          <TopicsCompletedChart />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Suspense fallback={<ChartCardSkeleton />}>
          <SubjectTimeDistributionChart />
        </Suspense>

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
