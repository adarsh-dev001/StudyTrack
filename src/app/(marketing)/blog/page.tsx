
import Link from 'next/link';
import { getAllPostsMeta, type PostMeta } from '@/lib/blog.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, Tag } from 'lucide-react';
import { format } from 'date-fns';

export const metadata = {
  title: 'StudyTrack Blog - Tips, Guides, and Strategies',
  description: 'Explore articles on study strategies, exam preparation, productivity, and more to help you succeed with StudyTrack.',
};

export default async function BlogIndexPage() {
  const posts = await getAllPostsMeta(); // Already sorted by date descending

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

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground">No blog posts yet. Check back soon!</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.slug} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="font-headline text-xl hover:text-primary transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </CardTitle>
                <div className="text-xs text-muted-foreground space-x-2 flex items-center pt-1">
                  <span className="flex items-center"><CalendarDays className="mr-1 h-3 w-3" /> {format(new Date(post.date), 'MMM d, yyyy')}</span>
                  <span className="flex items-center"><Tag className="mr-1 h-3 w-3" /> {post.category}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{post.metaDescription}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
                  <Link href={`/blog/${post.slug}`}>
                    Read More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
