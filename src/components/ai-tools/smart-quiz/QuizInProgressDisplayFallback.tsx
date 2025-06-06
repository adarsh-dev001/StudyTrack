
'use client';

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizInProgressDisplayFallback() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-md border-primary/40">
        <CardHeader className="p-3 sm:p-4 bg-primary/5 rounded-t-lg">
          <div className="flex justify-between items-center mb-1 sm:mb-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/4" />
          </div>
          <Skeleton className="h-2.5 w-full" />
        </CardHeader>
      </Card>
      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-6 w-full mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2 p-3 rounded-md border">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 p-4 sm:p-6 border-t">
          <Skeleton className="h-9 w-full sm:w-1/3" />
          <Skeleton className="h-9 w-full sm:w-1/3" />
        </CardFooter>
      </Card>
    </div>
  );
}
