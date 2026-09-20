import type { MetadataRoute } from 'next';
import { SHOP } from '@/lib/shop';

/**
 * Installed to the home screen, this opens the stock register.
 *
 * Whoever installs it is running the shop — customers arrive by a WhatsApp
 * link and have no reason to install anything. Starting at the catalogue
 * would cost a tap into the admin every single time it is opened.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SHOP.name,
    short_name: 'Sri Guru',
    description: 'Stock register and sales book for Sri Guru Raghavendra Fabrics.',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fbf7f4',
    theme_color: '#5c1f2b',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      // Android crops icons to its own shape; the maskable one keeps the
      // motif inside the safe area so nothing is sliced off.
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Add a saree', short_name: 'Add', url: '/admin/add' },
      { name: 'Sales book', short_name: 'Sales', url: '/admin/sales' },
      { name: 'Store receipts', short_name: 'Receipts', url: '/admin/receipts' },
    ],
  };
}
