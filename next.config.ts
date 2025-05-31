
import type {NextConfig} from 'next';
// Removed: import createMDX from '@next/mdx'

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
  // pageExtensions are still needed if you use .mdx files with next-mdx-remote
  // or might plan to use .mdx files as pages directly later.
  // If you are *sure* you only use next-mdx-remote and it doesn't require 'mdx' here,
  // you could remove 'md', 'mdx'. For safety, keeping them is usually fine.
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
};
 
// Removed: const withMDX = createMDX(...)
// Removed: export default withMDX(nextConfig);

export default nextConfig;
