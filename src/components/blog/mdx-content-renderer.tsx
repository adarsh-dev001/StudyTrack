
'use client';

import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';
import { components } from '@/lib/mdx-components'; // Import custom components
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Optional: for a better loading state

interface MdxContentRendererProps {
  source: MDXRemoteSerializeResult;
}

export default function MdxContentRenderer({ source }: MdxContentRendererProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !source) {
    // Fallback loading state
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return <MDXRemote {...source} components={components} />;
}
