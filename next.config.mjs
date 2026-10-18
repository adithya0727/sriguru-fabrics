/** @type {import('next').NextConfig} */
const nextConfig = {
  // Local testing only: lets the dev server accept requests proxied in through
  // a Cloudflare quick tunnel, so the app can be tried on a real phone without
  // deploying. Every `cloudflared` run gets a fresh hostname, so this is a
  // wildcard — pinning one meant editing this file for every test session.
  // Harmless in production, where requests arrive on the real domain.
  allowedDevOrigins: ['*.trycloudflare.com'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
