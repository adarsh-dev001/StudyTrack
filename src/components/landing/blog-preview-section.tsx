
import Link from 'next/link';
import Image from 'next/image';
import { getAllPostsMeta, type PostMeta } from '@/lib/blog.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookCopy, CalendarDays, Tag } from 'lucide-react';
import { format } from 'date-fns';

export async function BlogPreviewSection() {
  const allPosts = await getAllPostsMeta();
  const recentPosts = allPosts.slice(0, 3);

  return (
    <section id="blog-preview" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/20">
      <div className="px-4 md:px-6">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
              Stay Informed
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
              From Our Blog
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Discover the latest articles, tips, and strategies to boost your study productivity.
            </p>
          </div>

          {recentPosts.length === 0 ? (
            <p className="text-center text-muted-foreground">No blog posts available yet. Check back soon!</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <Card key={post.slug} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300_transform hover:-translate-y-1">
                  <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] relative w-full overflow-hidden">
                    <Image 
                      src={post.featuredImage || "https://placehold.co/600x338.png"}
                      alt={post.title}
                      layout="fill"
                      objectFit="cover"
                      className="hover:scale-105 transition-transform duration-300"
                      data-ai-hint="article highlight"
                    />
                  </Link>
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
                    <CardDescription>{post.metaDescription.substring(0, 150)}{post.metaDescription.length > 150 ? '...' : ''}</CardDescription>
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

          {recentPosts.length > 0 && (
            <div className="mt-12 text-center">
              <Button size="lg" asChild>
                <Link href="/blog">
                  View All Posts <BookCopy className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
