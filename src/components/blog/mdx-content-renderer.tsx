
'use client';

import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';
import { components } from '@/lib/blog.tsx'; // Import custom components

interface MdxContentRendererProps {
  source: MDXRemoteSerializeResult;
}

export default function MdxContentRenderer({ source }: MdxContentRendererProps) {
  return <MDXRemote {...source} components={components} />;
}
