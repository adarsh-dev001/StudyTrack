
// This page will be a Server Component for data fetching
// and pass the serialized MDX to a Client Component for rendering.

import type React from 'react';
import { getPostBySlug, type PostMeta } from '@/lib/blog'; // Ensure this path is correct
import { notFound } from 'next/navigation'; // Use for Server Components
import { format } from 'date-fns';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import MdxContentRenderer from '@/components/blog/mdx-content-renderer'; // The client component for rendering
import { Skeleton } from '@/components/ui/skeleton'; // For potential Suspense boundary
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';


// Interface for the data structure returned by getPostBySlug
interface BlogPostData {
  mdxSource: MDXRemoteSerializeResult;
  metadata: PostMeta;
}

// generateMetadata can be used for SEO in Server Components
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const postData = await getPostBySlug(params.slug);
  if (!postData) {
    return {
      title: 'Post Not Found - StudyTrack Blog',
    };
  }
  return {
    title: `${postData.metadata.title} - StudyTrack Blog`,
    description: postData.metadata.metaDescription,
    category: postData.metadata.category,
    authors: [{ name: postData.metadata.author }],
    openGraph: {
        title: postData.metadata.title,
        description: postData.metadata.metaDescription,
        type: 'article',
        publishedTime: postData.metadata.date,
        authors: [postData.metadata.author],
        tags: [postData.metadata.category],
    },
  };
}

// generateStaticParams can be used for pre-rendering paths at build time
// export async function generateStaticParams() {
//   const slugs = getPostSlugs(); // Assuming you have this function in blog.tsx
//   return slugs.map(slug => ({ slug }));
// }


export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const postData = await getPostBySlug(params.slug);

  if (!postData) {
    notFound(); // Correct way to handle not found in Server Components
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-3xl">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/blog">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>
      <article>
        <header className="mb-8">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl mb-3">
            {postData.metadata.title}
          </h1>
          <div className="text-sm text-muted-foreground">
            <span>By {postData.metadata.author}</span> | <span>Published on {format(new Date(postData.metadata.date), 'MMMM d, yyyy')}</span> | <span>Category: {postData.metadata.category}</span>
          </div>
        </header>
        
        <div className="prose prose-lg lg:prose-xl max-w-none dark:prose-invert text-foreground prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-code:text-foreground prose-code:bg-muted prose-code:p-1 prose-code:rounded-md prose-table:border prose-th:bg-muted prose-li:marker:text-primary">
          {/* MDXRemote will be handled by the client component */}
          <MdxContentRenderer source={postData.mdxSource} />
        </div>
      </article>
    </div>
  );
}
