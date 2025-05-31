
'use client';

import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';
import { components } from '@/lib/mdx-components'; // Import custom components from the client-safe file

interface MdxContentRendererProps {
  source: MDXRemoteSerializeResult;
}

export default function MdxContentRenderer({ source }: MdxContentRendererProps) {
  // If source is somehow undefined or null, render nothing or a fallback.
  // This can happen if data fetching fails and isn't caught before reaching here.
  if (!source) {
    return <p>Error loading content.</p>;
  }
  return <MDXRemote {...source} components={components} />;
}

