
"use client";

import type React from 'react';
import { Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighlightBoxProps {
  type?: 'info' | 'warning' | 'tip';
  title?: string;
  children: React.ReactNode;
}

export default function HighlightBox({ type = 'info', title, children }: HighlightBoxProps) {
  const baseClasses = "my-6 p-4 border-l-4 rounded-r-md shadow-md";
  let typeClasses = "";
  let IconComponent = Info;

  switch (type) {
    case 'warning':
      typeClasses = "bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300";
      IconComponent = AlertTriangle;
      break;
    case 'tip':
      typeClasses = "bg-green-50 border-green-400 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300";
      IconComponent = Lightbulb;
      break;
    case 'info':
    default:
      typeClasses = "bg-sky-50 border-sky-400 text-sky-800 dark:bg-sky-900/30 dark:border-sky-600 dark:text-sky-300";
      IconComponent = Info;
      break;
  }

  return (
    <div className={cn(baseClasses, typeClasses)}>
      <div className="flex items-start">
        <IconComponent className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <h5 className="font-semibold text-md mb-1">{title}</h5>}
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-a:text-inherit hover:prose-a:text-inherit">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
