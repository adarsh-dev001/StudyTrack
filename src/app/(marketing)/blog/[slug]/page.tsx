
import { getPostBySlug, getPostSlugs } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { format } from 'date-fns';

type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      // images: post.featuredImage ? [post.featuredImage] : ((await parent).openGraph?.images || []),
    },
    // Add more metadata as needed, like keywords (tags)
  };
}

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl mb-3">
          {post.title}
        </h1>
        <div className="text-sm text-muted-foreground">
          <span>By {post.author}</span> | <span>Published on {format(new Date(post.date), 'MMMM d, yyyy')}</span> | <span>Category: {post.category}</span>
        </div>
      </header>
      
      <div className="prose prose-lg max-w-none dark:prose-invert text-foreground">
        {post.content}
      </div>

      {/* You can add related posts or a comment section here later */}
    </article>
  );
}
