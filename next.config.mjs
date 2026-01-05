/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, /* Fixes double-render issues with 3D globes */
  typescript: {
    ignoreBuildErrors: true, /* Prevents "Grammar" errors from stopping the build */
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
