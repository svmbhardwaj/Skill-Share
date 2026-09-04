import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Allow images from external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile images
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com', // Default service icons
        pathname: '/**',
      },
    ],
  },

  // Production optimizations
  poweredByHeader: false,
  
  // Ensure trailing slashes are consistent
  trailingSlash: false,
};

export default nextConfig;
