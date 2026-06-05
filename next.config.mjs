/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export → produces ./out, consumed by Capacitor for the APK build.
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  // Required so the Capacitor WebView resolves assets with relative paths.
  trailingSlash: true,
};

export default nextConfig;
