
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
  featuredImage?: string;
  [key: string]: any;
}

export interface BlogPostPageData {
  mdxSource: MDXRemoteSerializeResult;
  metadata: PostMeta;
}

function normalizeImagePath(imagePath?: string): string | undefined {
  if (typeof imagePath !== 'string' || imagePath.trim() === "") {
    return undefined; // Explicitly return undefined for non-strings or empty/whitespace-only strings
  }

  let normalizedPath = imagePath.trim();

  // Handle protocol-relative URLs by prepending https:
  if (normalizedPath.startsWith('//')) {
    return 'https:' + normalizedPath;
  }

  // If it's already a full HTTP/HTTPS URL, return as is
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }

  // Remove 'public/' prefix if present, as next/image serves from public root
  if (normalizedPath.startsWith('public/')) {
    normalizedPath = normalizedPath.substring('public'.length);
  }

  // Ensure local paths start with a single '/'
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  // Avoid returning just "/" if all else was stripped
  if (normalizedPath === '/') {
    return undefined;
  }

  // Sanitize multiple slashes, e.g. ///image.jpg -> /image.jpg
  normalizedPath = normalizedPath.replace(/\/\/+/g, '/');

  return normalizedPath;
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
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data: frontmatterData, content: mdxSourceContent } = matter(fileContents);

  if (!frontmatterData.title) {
    console.warn(`Blog post with slug '${realSlug}' has no title in frontmatter. Treating as not found.`);
    return null;
  }

  const mdxSource = await serialize(mdxSourceContent, {
    scope: frontmatterData,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
      parseFrontmatter: false,
    },
  });

  const metadata: PostMeta = {
    slug: realSlug,
    title: frontmatterData.title as string,
    date: (frontmatterData.date || new Date().toISOString()) as string,
    category: (frontmatterData.category || 'Uncategorized') as string,
    metaDescription: (frontmatterData.metaDescription || '') as string,
    author: (frontmatterData.author || 'Anonymous') as string,
    featuredImage: normalizeImagePath(frontmatterData.featuredImage as string | undefined),
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

    if (!data.title) {
      console.warn(`Post with slug '${slug}' is missing a title. It will be excluded.`);
      return null;
    }

    return {
      slug,
      title: data.title as string,
      date: (data.date || new Date().toISOString()) as string,
      category: (data.category || 'Uncategorized') as string,
      metaDescription: (data.metaDescription || '') as string,
      author: (data.author || 'Anonymous') as string,
      featuredImage: normalizeImagePath(data.featuredImage as string | undefined),
      ...data,
    } as PostMeta;
  });

  const posts = (await Promise.all(postsDataPromises)).filter(post => post !== null) as PostMeta[];
  
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPostsMeta();
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories).sort();
}
