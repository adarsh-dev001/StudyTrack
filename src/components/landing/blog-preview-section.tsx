
'use client'; // Add this if it's not already there, for Framer Motion

import Link from 'next/link';
import Image from 'next/image';
import type { PostMeta } from '@/lib/blog.tsx'; // Assuming this path is correct
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookCopy, CalendarDays, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';


const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

interface BlogPreviewSectionProps {
    recentPosts: PostMeta[];
}

// This component will now be client-side to handle the state for posts
export default function BlogPreviewSectionClient({ recentPosts }: BlogPreviewSectionProps) {
  return (
    <motion.section 
      id="blog-preview" 
      className="w-full py-12 md:py-20 lg:py-28 bg-secondary/20"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-10 md:mb-12">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-xs sm:text-sm text-primary font-medium">
            Stay Informed
          </div>
          <h2 className="font-headline text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-foreground">
            From Our Blog
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg/relaxed xl:text-xl/relaxed">
            Discover the latest articles, tips, and strategies to boost your study productivity.
          </p>
        </div>

        {recentPosts.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm sm:text-base">No blog posts available yet. Check back soon!</p>
        ) : (
          <motion.div 
            className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {recentPosts.map((post, index) => (
              <motion.div key={post.slug} variants={cardVariants} whileHover={{ y: -5, transition: { duration: 0.2 }}}>
                <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform">
                  <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] relative w-full overflow-hidden">
                    <Image 
                      src={post.featuredImage || "https://placehold.co/600x338.png"}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      className="hover:scale-105 transition-transform duration-300"
                      data-ai-hint="article highlight"
                      priority={index < 2}
                    />
                  </Link>
                  <CardHeader className="p-4 sm:p-5">
                    <CardTitle className="font-headline text-lg sm:text-xl hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground space-x-1.5 sm:space-x-2 flex items-center pt-1">
                        <span className="flex items-center"><CalendarDays className="mr-1 h-3 w-3" /> {format(new Date(post.date), 'MMM d, yyyy')}</span>
                        <span className="flex items-center"><Tag className="mr-1 h-3 w-3" /> {post.category}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow p-4 sm:p-5 pt-0">
                    <CardDescription className="text-xs sm:text-sm">{post.metaDescription.substring(0, 120)}{post.metaDescription.length > 120 ? '...' : ''}</CardDescription>
                  </CardContent>
                  <CardFooter className="p-4 sm:p-5">
                    <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline text-xs sm:text-sm">
                      <Link href={`/blog/${post.slug}`}>
                        Read More <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {recentPosts.length > 0 && (
          <motion.div 
            className="mt-10 md:mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button size="lg" asChild className="text-sm sm:text-base">
              <Link href="/blog">
                View All Posts <BookCopy className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}


// Wrapper server component to fetch data
async function BlogPreviewSection() {
  const { getAllPostsMeta } = await import('@/lib/blog.tsx'); // Ensure correct import
  const allPosts = await getAllPostsMeta();
  const recentPosts = allPosts.slice(0, 3);

  return <BlogPreviewSectionClient recentPosts={recentPosts} />;
}

export default BlogPreviewSection;
