
'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function YouTubeSummarizerResultsDisplayFallback() {
  return (
    <div className="space-y-6 mt-6">
      <Card className="shadow-md">
        <CardHeader className="p-4 sm:p-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      </Card>
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <p>AI is processing the video transcript...</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Card className="shadow-md">
        <CardHeader className="p-4 sm:p-6">
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full mt-4" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}


    