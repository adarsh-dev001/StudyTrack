
export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
      <p className="text-lg text-muted-foreground">Manage your account and application preferences.</p>
      {/* Settings form for profile, preferences, etc. will go here */}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6 ">
        <h2 className="text-xl font-semibold mb-2">Profile Settings</h2>
        <p className="text-muted-foreground mb-4">Update your personal information.</p>
        {/* Placeholder for form fields */}
         <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">Full Name</label>
            <input type="text" id="name" defaultValue="User Name" className="block w-full rounded-md border-input bg-background p-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
        </div>
         <div className="space-y-2 mt-4">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">Email Address</label>
            <input type="email" id="email" defaultValue="user@example.com" className="block w-full rounded-md border-input bg-background p-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
        </div>
         <button type="submit" className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            Save Changes
          </button>
      </div>
       <div className="rounded-xl border bg-card text-card-foreground shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-2">Theme Settings</h2>
        <p className="text-muted-foreground mb-4">Customize the app appearance.</p>
        {/* Placeholder for theme toggle */}
         <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Dark Mode</span>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-gray-700">
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out dark:translate-x-5"></span>
            </button>
        </div>
      </div>
    </div>
  );
}
