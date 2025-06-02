
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
          {postData.metadata.featuredImage && (
            <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-lg overflow-hidden mb-6 shadow-lg">
              <Image
                src={postData.metadata.featuredImage}
                alt={postData.metadata.title}
                fill // Changed layout="fill"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes
                style={{ objectFit: 'cover' }} // Changed objectFit
                data-ai-hint="article banner"
                priority // For LCP
              />
            </div>
          )}
          {!postData.metadata.featuredImage && (
             <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-lg overflow-hidden mb-6 shadow-lg bg-muted">
              <Image
                src="https://placehold.co/800x450.png"
                alt="Placeholder Image"
                fill // Changed layout="fill"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes
                style={{ objectFit: 'cover' }} // Changed objectFit
                data-ai-hint="article banner placeholder"
              />
            </div>
          )}
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl mb-3">
            {postData.metadata.title}
          </h1>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
            <span>By {postData.metadata.author}</span>
            <span className="hidden sm:inline">|</span>
            <span>Published on {format(new Date(postData.metadata.date), 'MMMM d, yyyy')}</span>
            <span className="hidden sm:inline">|</span>
            <span>Category: {postData.metadata.category}</span>
          </div>
        </header>
        
        <div className="prose prose-lg lg:prose-xl max-w-none dark:prose-invert text-foreground prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-code:text-foreground prose-code:bg-muted prose-code:p-1 prose-code:rounded-md prose-table:border prose-th:bg-muted prose-li:marker:text-primary">
          <MdxContentRenderer source={postData.mdxSource} />
        </div>
      </article>
    </div>
  );
}
