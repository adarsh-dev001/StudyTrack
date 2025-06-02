
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
    <section id="features" className="w-full py-12 md:py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-10 md:mb-12">
          <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-xs sm:text-sm text-secondary-foreground">Key Features</div>
          <h2 className="font-headline text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-foreground">
            Unlock Your Potential with StudyTrack
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg/relaxed xl:text-xl/relaxed">
            Everything you need to organize your studies, stay focused, and achieve your exam goals.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-10 md:mb-12">
          {featuresRow1.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center my-10 md:my-12">
           <h2 className="font-headline text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-foreground">
            Streamline Your Study Routine
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg/relaxed xl:text-xl/relaxed">
            Powerful tools designed to enhance your productivity and learning efficiency.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {featuresRow2.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
