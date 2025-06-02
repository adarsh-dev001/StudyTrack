
import { FeatureCard } from './feature-card';
import { CalendarDays, ClipboardCheck, Palette, BrainCircuit, Timer, Flame, BarChart3 } from 'lucide-react';

const featuresRow1 = [
  {
    icon: CalendarDays,
    title: 'Interactive Study Planner',
    description: 'Weekly & monthly planner with drag-and-drop UX for easy scheduling.',
  },
  {
    icon: ClipboardCheck,
    title: 'Customizable Task Creation',
    description: 'Add subjects, topics, estimated time, and deadlines to your planner.',
  },
  {
    icon: Palette,
    title: 'Color-Coded Tasks',
    description: 'Visually organize tasks by urgency or subject with color-coding.',
  },
];

const featuresRow2 = [
  {
    icon: BrainCircuit,
    title: 'AI Syllabus Suggestions',
    description: 'Get AI-powered topic suggestions based on your selected exam (NEET, UPSC, JEE).',
  },
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    description: 'Boost focus with a built-in Pomodoro timer featuring customizable sessions.',
  },
  {
    icon: Flame,
    title: 'Daily Study Streaks',
    description: 'Track daily study check-ins and build consistency with motivating streaks.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="px-4 md:px-6"> {/* Removed 'container' class */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Key Features</div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
            Unlock Your Potential with StudyTrack
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Everything you need to organize your studies, stay focused, and achieve your exam goals.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {featuresRow1.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 text-center my-12">
           <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
            Streamline Your Study Routine
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Powerful tools designed to enhance your productivity and learning efficiency.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuresRow2.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
         {/* The "And More..." section and the Productivity Stats card have been removed */}
      </div>
    </section>
  );
}
