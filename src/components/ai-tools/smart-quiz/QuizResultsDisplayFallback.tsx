
'use client';

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizResultsDisplayFallback() {
  return (
    <Card className="shadow-lg border-green-500/50">
      <CardHeader className="p-4 sm:p-6 bg-green-500/10 rounded-t-lg text-center">
        <Skeleton className="h-12 w-12 mx-auto mb-2 rounded-full" />
        <Skeleton className="h-7 w-3/4 mx-auto" />
        <Skeleton className="h-5 w-1/2 mx-auto mt-1" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="py-3 sm:py-4">
          <Skeleton className="h-6 w-5/6 mb-3" />
          <div className="space-y-2 mb-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-2 p-2.5 rounded-md border">
                <Skeleton className="h-4 w-4 mt-px" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
          <Skeleton className="h-16 w-full rounded-md" /> {/* Explanation box */}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 p-4 sm:p-6 border-t">
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 flex-1 sm:w-28" />
          <Skeleton className="h-10 flex-1 sm:w-28" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Skeleton className="h-10 flex-1 sm:w-36" />
          <Skeleton className="h-10 flex-1 sm:w-40" />
        </div>
      </CardFooter>
    </Card>
  );
}
