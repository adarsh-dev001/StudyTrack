
// This component is now a Server Component.
// It fetches data and passes it to the Client Component for rendering.

import React from 'react'; // Keep React for JSX
import { getAllPostsMeta } from '@/lib/blog'; // This is a server-only import, fine here.
import BlogPreviewSectionClient from './blog-preview-section-client'; // Import the new Client Component

export default async function BlogPreviewSection() {
  const allPosts = await getAllPostsMeta();
  const recentPosts = allPosts.slice(0, 3); // Get the 3 most recent posts

  return <BlogPreviewSectionClient recentPosts={recentPosts} />;
}
