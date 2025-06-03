
'use client'; 

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpenText,
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  BrainCircuit, 
  Brain,        
  Timer,
  Flame,
  BarChart3,
  Settings,
  ShoppingCart, 
  HelpCircle, // Added for SmartQuiz AI
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/study-planner', label: 'Study Planner', icon: CalendarDays },
  { href: '/tasks', label: 'Tasks', icon: ClipboardCheck },
  { href: '/ai-tools', label: 'AI Tools Hub', icon: BrainCircuit },
  { href: '/ai-tools/smart-quiz', label: 'SmartQuiz AI', icon: HelpCircle }, // New Item for SmartQuiz
  { href: '/ai-recommendations', label: 'AI Coach', icon: Brain },
  { href: '/pomodoro', label: 'Pomodoro Timer', icon: Timer },
  { href: '/streaks', label: 'Study Streaks', icon: Flame },
  // { href: '/analytics', label: 'Analytics', icon: BarChart3 }, // Temporarily disabled
  { href: '/rewards-shop', label: 'Rewards Shop', icon: ShoppingCart }, 
];

export function AppSidebar() {
  const pathname = usePathname();

  const isNavItemActive = (itemHref: string) => {
    if (itemHref === '/dashboard' || itemHref === '/ai-recommendations' || itemHref === '/ai-tools/smart-quiz') {
      return pathname === itemHref;
    }
    // For other items, check if pathname starts with the item's href
    // e.g. /ai-tools/syllabus-suggester should make /ai-tools active
    if (itemHref === '/ai-tools'){
        return pathname.startsWith('/ai-tools') && pathname !== '/ai-tools/smart-quiz';
    }
    return pathname.startsWith(itemHref);
  };


  return (
    <Sidebar collapsible="icon" defaultOpen={true} className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
           <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <BookOpenText className="h-7 w-7 text-primary" />
            <span className="font-headline text-xl font-bold text-sidebar-foreground">StudyTrack</span>
          </Link>
          {/* Desktop sidebar collapse trigger */}
          <SidebarTrigger className="hidden lg:flex" />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow">
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton 
                asChild 
                tooltip={{ children: item.label, side: 'right', align: 'center' }}
                isActive={isNavItemActive(item.href)}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip={{ children: "Settings", side: 'right', align: 'center' }}
              isActive={pathname === '/settings'}
            >
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

    
