import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'apexcharts',
      'react-apexcharts',
      '@fullcalendar/react',
      '@fullcalendar/core',
      'swiper',
    ],
  },
  
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      };
    }
    
    return config;
  },
    
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
