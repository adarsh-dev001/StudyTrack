
'use client';

import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';
import { components } from '@/lib/mdx-components'; // Import custom components from the new client-safe file

interface MdxContentRendererProps {
  source: MDXRemoteSerializeResult;
}

export default function MdxContentRenderer({ source }: MdxContentRendererProps) {
  return <MDXRemote {...source} components={components} />;
}
