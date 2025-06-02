
import type React from 'react';
import { getPostBySlug, type PostMeta } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import MdxContentRenderer from '@/components/blog/mdx-content-renderer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';

interface BlogPostData {
  mdxSource: MDXRemoteSerializeResult;
  metadata: PostMeta;
}

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
        images: postData.metadata.featuredImage ? [{ url: postData.metadata.featuredImage }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const postData = await getPostBySlug(params.slug);

  if (!postData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 md:px-6 lg:px-8 max-w-3xl">
      <div className="mb-4 sm:mb-6">
        <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
          <Link href="/blog">
            <ChevronLeft className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>
      <article>
        <header className="mb-6 sm:mb-8">
          {postData.metadata.featuredImage && (
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-4 sm:mb-6 shadow-lg">
              <Image
                src={postData.metadata.featuredImage}
                alt={postData.metadata.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                data-ai-hint="article banner"
                priority // Added priority
              />
            </div>
          )}
          {!postData.metadata.featuredImage && (
             <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-4 sm:mb-6 shadow-lg bg-muted">
              <Image
                src="https://placehold.co/800x450.png"
                alt="Placeholder Image"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                data-ai-hint="article banner placeholder"
                priority // Added priority for placeholder if it's the main image
              />
            </div>
          )}
          <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl mb-2 sm:mb-3">
            {postData.metadata.title}
          </h1>
          <div className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:flex-wrap gap-x-2 gap-y-0.5 sm:gap-y-1">
            <span>By {postData.metadata.author}</span>
            <span className="hidden sm:inline">|</span>
            <span>Published on {format(new Date(postData.metadata.date), 'MMMM d, yyyy')}</span>
            <span className="hidden sm:inline">|</span>
            <span>Category: {postData.metadata.category}</span>
          </div>
        </header>
        
        <div className="prose prose-base sm:prose-lg max-w-none dark:prose-invert text-foreground prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-code:text-foreground prose-code:bg-muted prose-code:p-1 prose-code:rounded-md prose-table:border prose-th:bg-muted prose-li:marker:text-primary">
          <MdxContentRenderer source={postData.mdxSource} />
        </div>
      </article>
    </div>
  );
}
