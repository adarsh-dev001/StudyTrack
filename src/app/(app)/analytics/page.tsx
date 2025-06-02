
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Info } from "lucide-react"; // Added Info icon

// Chart components are no longer imported at the top level to prevent them from running
// const WeeklyStudyHoursChart = React.lazy(() => import('@/components/analytics/WeeklyStudyHoursChart'));
// const TopicsCompletedChart = React.lazy(() => import('@/components/analytics/TopicsCompletedChart'));
// const SubjectTimeDistributionChart = React.lazy(() => import('@/components/analytics/SubjectTimeDistributionChart'));


export default function AnalyticsPage() {
  return (
    <div className="w-full space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="shadow-lg w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
            <BarChart3 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Analytics Temporarily Unavailable</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            We're currently performing maintenance or updates on the analytics feature. 
            Please check back later!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Info className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground">
            This feature is temporarily disabled and will be back soon.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
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

