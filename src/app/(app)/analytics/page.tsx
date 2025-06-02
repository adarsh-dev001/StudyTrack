
'use client';

import React, { Suspense } from 'react'; // Added Suspense
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Info, Loader2 } from "lucide-react"; 
import ChartCardSkeleton from '@/components/analytics/ChartCardSkeleton'; // Import skeleton

// Lazy load chart components
const WeeklyStudyHoursChart = React.lazy(() => import('@/components/analytics/WeeklyStudyHoursChart'));
const TopicsCompletedChart = React.lazy(() => import('@/components/analytics/TopicsCompletedChart'));
const SubjectTimeDistributionChart = React.lazy(() => import('@/components/analytics/SubjectTimeDistributionChart'));


export default function AnalyticsPage() {
  const chartsEnabled = false; // Set to true to re-enable charts

  if (!chartsEnabled) {
    return (
      <div className="w-full space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 sm:p-6">
        <Card className="shadow-lg w-full max-w-lg text-center">
          <CardHeader className="p-4 sm:p-6">
            <div className="mx-auto bg-primary/10 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-3">
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">Analytics Temporarily Unavailable</CardTitle>
            <CardDescription className="text-sm sm:text-md text-muted-foreground">
              We're currently performing maintenance or updates on the analytics feature. 
              Please check back later!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Info className="h-12 w-12 sm:h-16 sm:w-16 text-amber-500 mx-auto mb-3 sm:mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">
              This feature is temporarily disabled and will be back soon.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center p-4 sm:p-6">
            <Button asChild>
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If chartsEnabled is true, render them with Suspense
  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">Study Analytics</h1>
      <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Suspense fallback={<ChartCardSkeleton />}>
          <WeeklyStudyHoursChart />
        </Suspense>
        <Suspense fallback={<ChartCardSkeleton />}>
          <TopicsCompletedChart />
        </Suspense>
      </div>
      <Suspense fallback={<ChartCardSkeleton />}>
        <SubjectTimeDistributionChart />
      </Suspense>
    </div>
  );
}
