
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
  featuredImage?: string; // This is now processed to be a valid URL or undefined
  [key: string]: any;
}

export interface BlogPostPageData {
  mdxSource: MDXRemoteSerializeResult;
  metadata: PostMeta;
}

function normalizeImagePath(imagePathInput?: string): string | undefined {
  if (typeof imagePathInput !== 'string' || imagePathInput.trim() === "") {
    return undefined;
  }

  let normalizedPath = imagePathInput.trim();

  // Handle protocol-relative URLs
  if (normalizedPath.startsWith('//')) {
    return 'https:' + normalizedPath;
  }

  // Handle absolute URLs
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    try {
      // Validate if it's a parsable URL
      new URL(normalizedPath);
      return normalizedPath;
    } catch (e) {
      console.warn(`[Blog Util] Invalid external URL format in frontmatter: "${normalizedPath}"`);
      return undefined; // Not a valid URL
    }
  }

  // Handle local paths
  // Remove 'public/' prefix if present, as next/image serves from public root
  if (normalizedPath.startsWith('public/')) {
    normalizedPath = normalizedPath.substring('public'.length);
  }

  // Ensure local paths start with a single '/'
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  // Sanitize multiple slashes, e.g. ///image.jpg -> /image.jpg
  normalizedPath = normalizedPath.replace(/\/\/+/g, '/');
  
  // Avoid returning just "/" if all else was stripped or if it's an invalid relative path
  if (normalizedPath === '/' || (normalizedPath.startsWith('/') && normalizedPath.length < 2)) {
    console.warn(`[Blog Util] Invalid local image path in frontmatter (resulted in '${normalizedPath}'): "${imagePathInput}"`);
    return undefined;
  }
  
  // Basic check for common image extensions for local paths.
  // If no extension or it's an unusual path, it might be problematic for next/image.
  if (normalizedPath.startsWith('/') && !/\.[a-zA-Z0-9]{2,4}(\?.*)?$/.test(normalizedPath)) {
    console.warn(`[Blog Util] Local image path "${normalizedPath}" (from "${imagePathInput}") does not seem to have a standard image extension. This might cause issues with next/image.`);
    // Depending on strictness, you could return undefined here.
    // For now, we'll let it pass, but this warning is important.
  }

  return normalizedPath;
}

export function getPostSlugs() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  try {
    return fs.readdirSync(postsDirectory).map(fileName => fileName.replace(/\.mdx$/, ''));
  } catch (error) {
    console.error("Error reading blog directory:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPostPageData | null> {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    console.warn(`[Blog Util] Blog post not found for slug "${realSlug}" at path: ${fullPath}`);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data: frontmatterData, content: mdxSourceContent } = matter(fileContents);

    if (!frontmatterData.title) {
      console.warn(`[Blog Util] Blog post with slug '${realSlug}' has no title in frontmatter. Skipping.`);
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
  } catch (e: any) {
    console.error(`[Blog Util] Error processing MDX file ${fullPath}:`, e.message);
    return null; 
  }
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
  const slugs = getPostSlugs();
  if (slugs.length === 0) {
    console.warn("[Blog Util] No slugs found in blog directory. Ensure MDX files exist.");
  }
  
  const postsDataPromises = slugs.map(async (slug) => {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[Blog Util] File not found during getAllPostsMeta for slug: ${slug} at path ${fullPath}`);
      return null;
    }
    try {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      if (!data.title) {
        console.warn(`[Blog Util] Post with slug '${slug}' is missing a title. It will be excluded.`);
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
    } catch (e: any) {
      console.error(`[Blog Util] Error processing frontmatter for MDX file ${fullPath}:`, e.message);
      return null; 
    }
  });

  const posts = (await Promise.all(postsDataPromises)).filter(post => post !== null) as PostMeta[];
  
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPostsMeta();
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories).sort();
}
