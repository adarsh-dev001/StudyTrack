
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

interface BlogPostPageData {
  mdxSource: MDXRemoteSerializeResult;
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
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data: frontmatterData, content: mdxSourceContent } = matter(fileContents);

  // For next-mdx-remote v4, use serialize
  const mdxSource = await serialize(mdxSourceContent, {
    scope: frontmatterData, // Pass frontmatter data to be available in MDX
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
      parseFrontmatter: false, // Already handled by gray-matter
    },
  });

  const metadata: PostMeta = {
    slug: realSlug,
    title: (frontmatterData.title || 'Untitled Post') as string,
    date: (frontmatterData.date || new Date().toISOString()) as string,
    category: (frontmatterData.category || 'Uncategorized') as string,
    metaDescription: (frontmatterData.metaDescription || '') as string,
    author: (frontmatterData.author || 'Anonymous') as string,
    ...frontmatterData,
  };

  return {
    mdxSource: mdxSource, // This is the MDXRemoteSerializeResult
    metadata: metadata,
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
    const { data } = matter(fileContents);
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
