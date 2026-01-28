/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Disable source maps in production to avoid parsing errors
  productionBrowserSourceMaps: false,
  // Opt into Turbopack (Next.js 16 default) with no custom config
  turbopack: {},
};

export default nextConfig;
