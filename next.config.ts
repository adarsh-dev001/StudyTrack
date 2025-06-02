
import type {NextConfig} from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: false, // Temporarily disable service worker registration for testing
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // You can add more PWA configurations here if needed
  // e.g., runtimeCaching: [...]
});

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
      {
        protocol: 'https',
        hostname: 'img.jagranjosh.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Added as a common source for future use
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.eggoz.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blogcdn.aakash.ac.in',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // If you are sure you only use next-mdx-remote for MDX content (e.g., from /content)
  // and don't intend to use .mdx files as pages directly in the /app or /pages directory,
  // you can remove 'md' and 'mdx' from pageExtensions.
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};
 
export default withPWA(nextConfig);
