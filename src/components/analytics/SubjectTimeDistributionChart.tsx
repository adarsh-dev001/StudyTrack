
'use client';

import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react"; // Renamed to avoid conflict
import { Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import * as Firestore from 'firebase/firestore'; 
import type { Task } from '@/components/planner/planner-types'; 
import { subjects as allSubjects } from '@/components/planner/planner-utils'; 
import ChartCardSkeleton from '@/components/analytics/ChartCardSkeleton';


interface SubjectTimeData {
  subject: string;
  hours: number;
  fill: string;
}

const chartConfig = {
  hours: { label: "Hours" },
} satisfies ChartConfig;

allSubjects.forEach((subject, index) => {
  chartConfig[subject.name as keyof typeof chartConfig] = {
    label: subject.name,
    color: `hsl(var(--chart-${(index % 5) + 1}))`
  };
});


export default function SubjectTimeDistributionChart() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<SubjectTimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setData([]); 
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const tasksCollectionRef = Firestore.collection(Firestore.db, "users", currentUser.uid, "plannerTasks");
        
        // Removed Firestore.select("subject", "duration") from the query
        const q = Firestore.query(tasksCollectionRef); 
        const querySnapshot = await Firestore.getDocs(q);

        const subjectHours: Record<string, number> = {};
        querySnapshot.forEach((doc) => {
          const task = doc.data() as Pick<Task, 'subject' | 'duration'>; // Still type as Pick for clarity on what's used
          if (task.subject && typeof task.duration === 'number') {
            const subjectName = allSubjects.find(s => s.id === task.subject)?.name || task.subject;
            subjectHours[subjectName] = (subjectHours[subjectName] || 0) + task.duration;
          }
        });

        const chartData: SubjectTimeData[] = Object.entries(subjectHours).map(([subject, hours], index) => ({
          subject,
          hours,
          fill: `hsl(var(--chart-${(index % 5) + 1}))`,
        }));
        
        if (chartData.length === 0) {
            setData([
                { subject: 'No Data', hours: 100, fill: 'hsl(var(--muted))' },
            ]);
        } else {
            setData(chartData);
        }

      } catch (error) {
        console.error("Error fetching subject time data:", error);
        setData([{ subject: 'Error', hours: 100, fill: 'hsl(var(--destructive))' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return <ChartCardSkeleton />; 
  }

  const totalHours = React.useMemo(() => {
    if(data.length === 1 && (data[0].subject === 'No Data' || data[0].subject === 'Error')) return 0;
    return data.reduce((acc, curr) => acc + curr.hours, 0)
  }, [data]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="bg-primary/10 p-3 rounded-lg">
            <PieChartIcon className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
            <CardTitle className="font-headline text-xl">Subject Time Distribution</CardTitle>
            <CardDescription>Breakdown of study hours by subject (from Planner)</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <RechartsPieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="hours"
              nameKey="subject"
              innerRadius={60}
              strokeWidth={5}
              label={({ subject, hours, percent }) =>
                totalHours > 0 ? `${subject} (${(percent * 100).toFixed(0)}%)` : subject
              }
              labelLine={false}
            >
               {data.map((entry) => (
                <Cell key={`cell-${entry.subject}`} fill={entry.fill} />
              ))}
            </Pie>
             {totalHours > 0 && <ChartLegend content={<ChartLegend />} />}
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
