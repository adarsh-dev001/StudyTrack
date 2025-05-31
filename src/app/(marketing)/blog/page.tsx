
import { getAllPostsMeta, getAllCategories, type PostMeta } from '@/lib/blog.tsx'; // Should now correctly point to server-only logic
import BlogPostsDisplayClient from '@/components/blog/blog-posts-display';

export const metadata = {
  title: 'StudyTrack Blog - Tips, Guides, and Strategies',
  description: 'Explore articles on study strategies, exam preparation, productivity, and more to help you succeed with StudyTrack.',
};

export default async function BlogIndexPage() {
  const posts = await getAllPostsMeta();
  const categories = await getAllCategories();

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          StudyTrack Blog
        </h1>
        <p className="mt-4 text-lg text-muted-foreground md:text-xl">
          Your go-to resource for study tips, exam strategies, and productivity hacks.
        </p>
      </header>

      <BlogPostsDisplayClient posts={posts} categories={categories} />
      
    </div>
  );
}
