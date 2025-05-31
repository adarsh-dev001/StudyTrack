
'use client';

import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartLegend, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3Icon } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts";

// Sample Data for Topics Completed (remains sample for now)
const topicsCompletedData = [
  { month: "Jan", target: 20, completed: 18 },
  { month: "Feb", target: 22, completed: 20 },
  { month: "Mar", target: 25, completed: 25 },
  { month: "Apr", target: 20, completed: 15 },
  { month: "May", target: 24, completed: 26 },
  { month: "Jun", target: 28, completed: 25 },
];

const topicsCompletedConfig = {
  target: { label: "Target Topics", color: "hsl(var(--chart-3))" },
  completed: { label: "Completed Topics", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

export default function TopicsCompletedChart() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="bg-primary/10 p-3 rounded-lg">
          <BarChart3Icon className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">Topics Completed</CardTitle>
          <CardDescription>Visualize target vs. completed topics per month. (Sample Data)</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topicsCompletedConfig} className="h-[250px] w-full">
          <RechartsBarChart data={topicsCompletedData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="target" fill="var(--color-target)" radius={4} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
            <ChartLegend content={<ChartLegend />} />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
