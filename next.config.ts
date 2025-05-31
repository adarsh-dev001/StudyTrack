
import type {NextConfig} from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If you are sure you only use next-mdx-remote for MDX content (e.g., from /content)
  // and don't intend to use .mdx files as pages directly in the /app or /pages directory,
  // you can remove 'md' and 'mdx' from pageExtensions.
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};
 
export default nextConfig;
