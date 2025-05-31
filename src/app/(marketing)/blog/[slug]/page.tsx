
'use client'; // Make this a client component

import type React from 'react';
import { useEffect, useState } from 'react';
import { getPostBySlug, type PostMeta } from '@/lib/blog.tsx';
// import { notFound } from 'next/navigation'; // notFound hook only works in Server Components
import { format } from 'date-fns';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { MDXRemote } from 'next-mdx-remote';
import { components } from '@/lib/mdx-components'; // Import custom components
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Interface for the data structure returned by getPostBySlug
interface BlogPostData {
  mdxSource: MDXRemoteSerializeResult;
  metadata: PostMeta;
}

// Dynamic metadata generation (generateMetadata) and generateStaticParams
// work with Server Components. For a fully client-rendered page from a dynamic slug,
// generateStaticParams can still suggest paths to Next.js for pre-rendering if possible,
// but metadata would typically be set via document.title or a meta tag manager in useEffect.

// For simplicity in this refactor, we'll focus on content rendering.
// SEO-critical metadata should ideally be handled by server-rendering parts of the page
// or by ensuring pre-rendering with generateStaticParams is effective.

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        setError(null);
        const postData = await getPostBySlug(params.slug);
        if (!postData) {
          setError("Post not found.");
          setPost(null);
        } else {
          setPost(postData);
        }
      } catch (e: any) {
        console.error("Error fetching post:", e);
        setError(e.message || "Failed to load post.");
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    if (params.slug) {
      fetchPost();
    }
  }, [params.slug]);

  useEffect(() => {
    if (post?.metadata.title) {
      document.title = `${post.metadata.title} - StudyTrack Blog`;
    } else if (error === "Post not found.") {
      document.title = "Post Not Found - StudyTrack Blog";
    } else if (error) {
      document.title = "Error - StudyTrack Blog";
    } else if (loading) {
      document.title = "Loading Post... - StudyTrack Blog";
    }
    // Cleanup function to reset title or set a default
    return () => {
      document.title = 'StudyTrack Blog';
    };
  }, [post, error, loading]);


  if (loading) {
    return (
      <article className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-3xl">
        <header className="mb-8">
          <Skeleton className="h-10 w-3/4 mb-3 md:h-12" />
          <Skeleton className="h-4 w-1/2 md:h-5" />
        </header>
        <div className="space-y-4 mt-6">
          <Skeleton className="h-5 w-full md:h-6" />
          <Skeleton className="h-5 w-11/12 md:h-6" />
          <Skeleton className="h-5 w-full md:h-6" />
          <Skeleton className="h-5 w-5/6 md:h-6" />
          <Skeleton className="h-40 w-full mt-4 md:h-48" />
           <Skeleton className="h-5 w-full md:h-6 mt-4" />
          <Skeleton className="h-5 w-11/12 md:h-6" />
        </div>
      </article>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto px-4 py-12 text-center flex flex-col items-center">
            <h1 className="text-3xl font-bold text-destructive mb-4">
                {error === "Post not found." ? "404 - Post Not Found" : "Error Loading Post"}
            </h1>
            <p className="text-muted-foreground mb-6">
                {error === "Post not found."
                ? "Sorry, the blog post you are looking for does not exist or could not be found."
                : "An unexpected error occurred while trying to load the post. Please try again later."}
            </p>
            <Button asChild>
                <Link href="/blog">Back to Blog</Link>
            </Button>
        </div>
    );
  }

  if (!post) {
    // This case should ideally be covered by loading or error states.
    // If it's reached, it implies an unexpected state.
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Post Unavailable</h1>
        <p>The blog post data could not be loaded.</p>
         <Button asChild className="mt-4">
            <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
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
        <MDXRemote {...post.mdxSource} components={components} />
      </div>
    </article>
  );
}
