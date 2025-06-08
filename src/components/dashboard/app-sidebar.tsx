
'use client'; 

import React from 'react'; 
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
  HelpCircle,
  Youtube, // Added Youtube icon
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Core Tools',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/study-planner', label: 'Study Planner', icon: CalendarDays },
      { href: '/tasks', label: 'Tasks', icon: ClipboardCheck },
      { href: '/pomodoro', label: 'Pomodoro Timer', icon: Timer },
    ]
  },
  {
    title: 'AI Features',
    items: [
      { href: '/ai-tools', label: 'AI Tools Hub', icon: BrainCircuit },
      { href: '/ai-tools/youtube-summarizer', label: 'Video Summarizer', icon: Youtube },
      { href: '/ai-tools/smart-quiz', label: 'SmartQuiz AI', icon: HelpCircle },
      { href: '/ai-recommendations', label: 'AI Coach', icon: Brain },
    ]
  },
  {
    title: 'Engagement',
    items: [
      { href: '/streaks', label: 'Study Streaks', icon: Flame },
      { href: '/rewards-shop', label: 'Rewards Shop', icon: ShoppingCart },
      // { href: '/analytics', label: 'Analytics', icon: BarChart3 }, // Temporarily disabled
    ]
  }
];

const AppSidebarComponent = () => {
  const pathname = usePathname();

  const isNavItemActive = (itemHref: string) => {
    // Exact match for top-level dashboard items and settings
    const exactMatchPaths = [
        '/dashboard', 
        '/ai-recommendations', 
        '/pomodoro', 
        '/streaks', 
        '/rewards-shop', 
        '/settings'
    ];
    if (exactMatchPaths.includes(itemHref)) {
      return pathname === itemHref;
    }
    // For /ai-tools, it should be active if pathname starts with /ai-tools but is NOT a more specific AI tool already listed
    if (itemHref === '/ai-tools') {
      return pathname.startsWith('/ai-tools') && 
             !pathname.startsWith('/ai-tools/smart-quiz') &&
             !pathname.startsWith('/ai-tools/youtube-summarizer'); // Add other specific AI tools here
    }
    // For specific AI tools like /ai-tools/smart-quiz or /ai-tools/youtube-summarizer
    if (itemHref.startsWith('/ai-tools/')) {
        return pathname === itemHref || pathname.startsWith(itemHref + "/"); // for potential sub-pages
    }
    // Default startsWith for other sections like /study-planner, /tasks
    return pathname.startsWith(itemHref);
  };


  return (
    <Sidebar collapsible="icon" defaultOpen={true} className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <BookOpenText className="h-7 w-7 text-primary" />
            <span className="font-headline text-xl font-bold text-sidebar-foreground">StudyTrack</span>
          </Link>
          <SidebarTrigger className="hidden lg:flex" />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow">
        <SidebarMenu>
          {navSections.map((section, sectionIndex) => (
            <React.Fragment key={section.title}>
              {sectionIndex > 0 && <SidebarSeparator className="my-2" />}
              <div 
                className="px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden"
              >
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = isNavItemActive(item.href);
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={{ children: item.label, side: 'right', align: 'center' }}
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-200",
                        isActive && "border-l-4 border-primary pl-1" 
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn(isActive ? "text-primary" : "")} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </React.Fragment>
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
              className={cn(
                "transition-all duration-200",
                pathname === '/settings' && "border-l-4 border-primary pl-1"
              )}
            >
              <Link href="/settings">
                <Settings className={cn(pathname === '/settings' ? "text-primary" : "")}/>
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export const AppSidebar = React.memo(AppSidebarComponent);
    
