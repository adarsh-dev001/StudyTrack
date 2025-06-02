
import type React from 'react';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import HighlightBox from '@/components/blog/HighlightBox'; // New import

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Custom components to pass to MDX
export const components = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn("font-headline text-3xl md:text-4xl font-bold mt-8 mb-4", props.className)} {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn("font-headline text-2xl md:text-3xl font-semibold mt-10 mb-4 pb-2 border-b border-border", props.className)} {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("font-headline text-xl md:text-2xl font-semibold mt-8 mb-3", props.className)} {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className={cn("font-headline text-lg md:text-xl font-semibold mt-6 mb-2", props.className)} {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("my-4 leading-relaxed", props.className)} {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn("my-4 list-disc list-outside pl-5 space-y-2 marker:text-primary", props.className)} {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("my-4 list-decimal list-outside pl-5 space-y-2 marker:text-primary", props.className)} {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    (<li className={cn("pb-0.5", props.className)} {...props} />) // Add some bottom padding to list items if needed
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className={cn("my-6 border-l-4 border-primary pl-4 italic text-muted-foreground", props.className)} {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className={cn("text-primary hover:underline decoration-primary/70 decoration-2 underline-offset-2 font-medium", props.className)} {...props} />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-x-auto rounded-lg border shadow-sm">
      <table className={cn("w-full my-0 caption-bottom text-sm", props.className)} {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className={cn("[&_tr]:border-b", props.className)} {...props} />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={cn("[&_tr:last-child]:border-0", props.className)} {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn("m-0 border-b p-0 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted even:bg-muted/30", props.className)} {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-semibold text-foreground bg-muted/50 [&[align=center]]:text-center [&[align=right]]:text-right",
        "border-r last:border-r-0 border-border", // Add vertical borders to th
        props.className
      )}
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "h-11 px-4 py-2 text-left align-middle [&:has([role=checkbox])]:pr-0 [&[align=center]]:text-center [&[align=right]]:text-right",
        "border-r last:border-r-0 border-border", // Add vertical borders to td
        props.className
      )}
      {...props}
    />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn("my-6 border-border", props.className)} {...props} />
  ),
  // Custom components for highlight boxes
  Highlight: HighlightBox,
  Tip: (props: Omit<React.ComponentProps<typeof HighlightBox>, 'type'>) => <HighlightBox type="tip" {...props} />,
  Info: (props: Omit<React.ComponentProps<typeof HighlightBox>, 'type'>) => <HighlightBox type="info" {...props} />,
  Warning: (props: Omit<React.ComponentProps<typeof HighlightBox>, 'type'>) => <HighlightBox type="warning" {...props} />,
};
