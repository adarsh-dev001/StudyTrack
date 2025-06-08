
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { PostMeta } from '@/lib/blog.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CalendarDays, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BlogPostsDisplayClientProps {
  posts: PostMeta[];
  categories: string[];
}

function BlogPostsDisplayClientComponent({ posts, categories }: BlogPostsDisplayClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = selectedCategory
    ? posts.filter(post => post.category === selectedCategory)
    : posts;

  return (
    <>
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <Badge
            variant={selectedCategory === null ? 'default' : 'secondary'}
            onClick={() => setSelectedCategory(null)}
            className="cursor-pointer px-3 py-1.5 text-sm hover:bg-primary/80 hover:text-primary-foreground transition-colors"
          >
            All Categories
          </Badge>
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'secondary'}
              onClick={() => setSelectedCategory(category)}
              className="cursor-pointer px-3 py-1.5 text-sm hover:bg-primary/80 hover:text-primary-foreground transition-colors"
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg">
          {selectedCategory 
            ? `No blog posts found in the "${selectedCategory}" category yet.` 
            : "No blog posts yet. Check back soon!"}
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <Card key={post.slug} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] relative w-full overflow-hidden bg-muted">
                <Image 
                  src={post.featuredImage || "https://placehold.co/600x338.png"}
                  alt={post.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="hover:scale-105 transition-transform duration-300"
                  data-ai-hint="article highlight"
                  priority={index < 3} // Prioritize the first 3 images
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
    </>
  );
}

export default React.memo(BlogPostsDisplayClientComponent);
