
import { getAllPostsMeta, getAllCategories, type PostMeta } from '@/lib/blog'; 
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
      <header className="mb-8 sm:mb-12 text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
          StudyTrack Blog
        </h1>
        <p className="mt-3 sm:mt-4 text-md text-muted-foreground md:text-lg max-w-xl sm:max-w-2xl mx-auto">
          Your go-to resource for study tips, exam strategies, and productivity hacks.
        </p>
      </header>

      <BlogPostsDisplayClient posts={posts} categories={categories} />
      
    </div>
  );
}

