
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const postsDirectory = path.join(process.cwd(), 'src', 'content', 'blog');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  metaDescription: string;
  author: string;
  [key: string]: any;
}

export interface Post extends PostMeta {
  content: React.ReactElement;
}

// Custom components to pass to MDX - temporarily not used for debugging
const components = {
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className={cn("w-full my-0", props.className)} {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className={cn("[&_tr]:border-b", props.className)} {...props} />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={cn("[&_tr:last-child]:border-0", props.className)} {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn("m-0 border-t p-0 even:bg-muted", props.className)} {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        props.className
      )}
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        props.className
      )}
      {...props}
    />
  ),
};

export function getPostSlugs() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs.readdirSync(postsDirectory).map(fileName => fileName.replace(/\.mdx$/, ''));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Blog post not found at path: ${fullPath}`);
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Let next-mdx-remote handle frontmatter parsing
  const { content: compiledContent, frontmatter } = await compileMDX<PostMeta>({
    source: fileContents,
    options: {
      parseFrontmatter: true,
      // mdxOptions: {
      // You can add remark/rehype plugins here if needed
      // remarkPlugins: [],
      // rehypePlugins: [],
      // },
    },
    // components: components, // Temporarily commented out for debugging
  });

  return {
    slug: realSlug,
    title: frontmatter.title || 'Untitled Post',
    date: frontmatter.date || new Date().toISOString(),
    category: frontmatter.category || 'Uncategorized',
    metaDescription: frontmatter.metaDescription || '',
    author: frontmatter.author || 'Anonymous',
    ...frontmatter, // include any other frontmatter data
    content: compiledContent,
  };
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
  const slugs = getPostSlugs();
  const postsPromises = slugs.map(async (slug) => {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found during getAllPostsMeta for slug: ${slug} at path ${fullPath}`);
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents); // gray-matter is fine for just metadata extraction
    return {
      slug,
      title: data.title || 'Untitled Post',
      date: data.date || new Date().toISOString(),
      category: data.category || 'Uncategorized',
      metaDescription: data.metaDescription || '',
      author: data.author || 'Anonymous',
      ...data,
    } as PostMeta;
  });

  const posts = (await Promise.all(postsPromises)).filter(post => post !== null) as PostMeta[];
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPostsMeta();
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories).sort();
}
