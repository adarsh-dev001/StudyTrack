
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChartCardSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 p-4 sm:p-6">
        <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
        <div className="flex-1 space-y-1.5 sm:space-y-2">
          <Skeleton className="h-4 w-3/4 sm:h-5" />
          <Skeleton className="h-3 w-1/2 sm:h-4" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Skeleton className="h-[200px] w-full sm:h-[250px]" />
      </CardContent>
    </Card>
  );
}
