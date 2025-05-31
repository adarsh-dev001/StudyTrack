
export default function DashboardPage() {
  return (
    <div className="w-full space-y-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
      <p className="text-lg text-muted-foreground">Welcome to your StudyTrack dashboard. Plan, track, and ace your exams!</p>
      {/* Dashboard content will go here, like overview cards, upcoming tasks, etc. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Upcoming Tasks</h2>
          <p className="text-muted-foreground">No upcoming tasks yet.</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Current Streak</h2>
          <p className="text-muted-foreground">Start studying to build your streak!</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Study Progress</h2>
          <p className="text-muted-foreground">Track your study hours here.</p>
        </div>
      </div>
    </div>
  );
}
