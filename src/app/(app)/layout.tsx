
'use client';

import type { Metadata } from 'next';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger as MobileSidebarTrigger } from '@/components/ui/sidebar';
import { BookOpenText, Settings, LogOut, Loader2, Coins } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

// export const metadata: Metadata = { // Cannot export metadata from client component
//   title: 'StudyTrack Dashboard',
//   description: 'Manage your studies effectively.',
// };

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const router = useRouter();
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const [loadingCoins, setLoadingCoins] = useState(true);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    let unsubscribeCoins: Unsubscribe | undefined;

    if (currentUser?.uid && db) {
      setLoadingCoins(true);
      const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      
      unsubscribeCoins = onSnapshot(userProfileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserCoins(typeof data.coins === 'number' ? data.coins : 0);
        } else {
          setUserCoins(0); // Default to 0 if profile doesn't exist
        }
        setLoadingCoins(false);
      }, (error) => {
        console.error("Error fetching user coins:", error);
        setUserCoins(0); // Default to 0 on error
        setLoadingCoins(false);
      });
    } else {
      setUserCoins(null); // No user, no coins
      setLoadingCoins(false);
    }

    return () => {
      if (unsubscribeCoins) {
        unsubscribeCoins();
      }
    };
  }, [currentUser?.uid]);


  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback or during initial render before effect runs.
    return null; 
  }

  const handleLogout = async () => {
    await logOut();
    // router.push('/login') is handled by logOut function in AuthContext
  };
  
  const userInitial = currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U');

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full"> {/* Added w-full here */}
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0"> {/* Added min-w-0 here */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 shrink-0">
            <div className="flex items-center gap-2">
              <MobileSidebarTrigger className="lg:hidden" />
              <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
                <BookOpenText className="h-6 w-6 text-primary" />
                <span className="font-headline text-xl font-bold text-foreground">StudyTrack</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser && (
                <Button variant="ghost" size="sm" asChild className="mr-1">
                  <Link href="/rewards-shop" className="flex items-center gap-1.5 px-2 py-1 h-auto">
                    <Coins className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    <span className="font-semibold text-sm text-foreground">
                      {loadingCoins ? <Loader2 className="h-4 w-4 animate-spin" /> : (userCoins ?? 0)}
                    </span>
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      {/* Add actual user avatar image if available later */}
                      <AvatarImage src="" alt="User avatar" /> 
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {currentUser.displayName || 'User Name'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email || 'user@example.com'}
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
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/30"> {/* Added consistent padding p-4 md:p-6 lg:p-8 */}
            {children}
          </main>
        </SidebarInset>
      </div>
      {/* Toaster removed from here, will use the one in RootLayout */}
    </SidebarProvider>
  );
}
