/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Vercel to include the Prisma WASM files in the serverless function
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/@prisma/client/runtime/*.js',
      './node_modules/@prisma/client/runtime/*.wasm',
      './node_modules/.prisma/client/*.so.node'
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },
};

export default nextConfig;
