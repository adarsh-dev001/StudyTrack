
import 'server-only'; // Ensures this module is only used on the server

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

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

export interface BlogPostPageData {
  mdxSource: MDXRemoteSerializeResult; // This is the correct type from serialize
  metadata: PostMeta;
}

export function getPostSlugs() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs.readdirSync(postsDirectory).map(fileName => fileName.replace(/\.mdx$/, ''));
}

export async function getPostBySlug(slug: string): Promise<BlogPostPageData | null> {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Blog post not found at path: ${fullPath}`);
    return null; // Page component will handle this with notFound()
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data: frontmatterData, content: mdxSourceContent } = matter(fileContents);

  // If title is missing in frontmatter, treat the post as non-existent/untitled
  if (!frontmatterData.title) {
    console.warn(`Blog post with slug '${realSlug}' has no title in frontmatter. Treating as not found.`);
    return null; // This will lead to a 404 on the page using this function
  }

  const mdxSource = await serialize(mdxSourceContent, {
    scope: frontmatterData,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
      parseFrontmatter: false, // Already handled by gray-matter
    },
  });

  const metadata: PostMeta = {
    slug: realSlug,
    title: frontmatterData.title as string, // Title is guaranteed by the check above
    date: (frontmatterData.date || new Date().toISOString()) as string,
    category: (frontmatterData.category || 'Uncategorized') as string,
    metaDescription: (frontmatterData.metaDescription || '') as string,
    author: (frontmatterData.author || 'Anonymous') as string,
    ...frontmatterData,
  };

  return {
    mdxSource: mdxSource,
    metadata: metadata,
  };
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
  const slugs = getPostSlugs();
  
  const postsDataPromises = slugs.map(async (slug) => {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found during getAllPostsMeta for slug: ${slug} at path ${fullPath}`);
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);

    // If title is missing, this post is considered "untitled" and should be filtered out
    if (!data.title) {
      console.warn(`Post with slug '${slug}' is missing a title. It will be excluded.`);
      return null;
    }

    return {
      slug,
      title: data.title as string, // Title is guaranteed
      date: (data.date || new Date().toISOString()) as string,
      category: (data.category || 'Uncategorized') as string,
      metaDescription: (data.metaDescription || '') as string,
      author: (data.author || 'Anonymous') as string,
      ...data,
    } as PostMeta;
  });

  const posts = (await Promise.all(postsDataPromises)).filter(post => post !== null) as PostMeta[];
  
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPostsMeta(); // This will now use the filtered list
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories).sort();
}
