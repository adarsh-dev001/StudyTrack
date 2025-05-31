
import { getPostBySlug, type PostMeta } from '@/lib/blog.tsx'; // Updated import if file was renamed, or keep if it's now server-only
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { format } from 'date-fns';
import type React from 'react';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import MdxContentRenderer from '@/components/blog/mdx-content-renderer';

type PageProps = {
  params: { slug: string };
};

// Interface for the data structure returned by getPostBySlug
interface BlogPostPageData {
  mdxSource: MDXRemoteSerializeResult;
  metadata: PostMeta;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Ensure getPostBySlug is imported from the correct (server-side) file
  const post: BlogPostPageData | null = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.metadata.title,
    description: post.metadata.metaDescription,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.metaDescription,
      type: 'article',
      publishedTime: post.metadata.date,
      authors: [post.metadata.author],
    },
  };
}

export async function generateStaticParams() {
  // Ensure getPostSlugs is imported from the correct (server-side) file if it's moved
  // For now, assuming it's still in blog.tsx which is now server-only
  const { getPostSlugs: getSlugs } = await import('@/lib/blog.tsx');
  const slugs = getSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export default async function BlogPostPage({ params }: PageProps) {
  // Ensure getPostBySlug is imported from the correct (server-side) file
  const post: BlogPostPageData | null = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl mb-3">
          {post.metadata.title}
        </h1>
        <div className="text-sm text-muted-foreground">
          <span>By {post.metadata.author}</span> | <span>Published on {format(new Date(post.metadata.date), 'MMMM d, yyyy')}</span> | <span>Category: {post.metadata.category}</span>
        </div>
      </header>
      
      <div className="prose prose-lg max-w-none dark:prose-invert text-foreground">
        {/* MdxContentRenderer will now import components from the client-safe mdx-components.tsx */}
        <MdxContentRenderer source={post.mdxSource} />
      </div>
    </article>
  );
}
