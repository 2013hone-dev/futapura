/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // ビルド時のESLintエラーを無視（警告のみ）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ビルド時のTypeScriptエラーを無視
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
