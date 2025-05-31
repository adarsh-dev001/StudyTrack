
'use client';

import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartLegend, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react"; // Corrected import
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";

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

export default function WeeklyStudyHoursChart() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="bg-primary/10 p-3 rounded-lg">
          <LineChart className="h-7 w-7 text-primary" /> {/* Corrected usage */}
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
  );
}
