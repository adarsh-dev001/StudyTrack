import type { Metadata } from 'next';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger as MobileSidebarTrigger } from '@/components/ui/sidebar';
import { BookOpenText, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is here if used globally within dashboard

export const metadata: Metadata = {
  title: 'StudyTrack Dashboard',
  description: 'Manage your studies effectively.',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}> {/* Default open on desktop */}
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 shrink-0">
            <div className="flex items-center gap-2">
              {/* Mobile sidebar trigger - uses PanelLeft icon from ui/sidebar */}
              <MobileSidebarTrigger className="lg:hidden" />
              {/* App logo/name - shown on mobile next to trigger */}
              <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
                <BookOpenText className="h-6 w-6 text-primary" />
                <span className="font-headline text-xl font-bold text-foreground">StudyTrack</span>
              </Link>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="user avatar" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">User Name</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/"> {/* Redirect to landing page on logout */}
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/30">
            {children}
          </main>
        </SidebarInset>
      </div>
      <Toaster /> {/* Global toaster for dashboard actions */}
    </SidebarProvider>
  );
}
