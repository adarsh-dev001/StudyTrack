import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300_transform hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-headline text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
