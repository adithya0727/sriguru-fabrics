/** @type {import('next').NextConfig} */
const nextConfig = {
  // Local testing only: lets the Next dev server accept requests proxied in
  // through a Cloudflare quick tunnel. Harmless in production, where requests
  // arrive on the real domain.
  allowedDevOrigins: ['functions-considerations-peers-supplied.trycloudflare.com'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
