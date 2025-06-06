
'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function SyllabusResultDisplayFallback() {
  return (
    <Card className="shadow-lg mt-6">
      <CardHeader className="p-4 sm:p-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <p>Generating your personalized syllabus...</p>
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border p-3 sm:p-4 rounded-lg">
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
