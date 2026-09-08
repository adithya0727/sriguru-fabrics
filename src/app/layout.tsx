import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

// Fraunces for display: a warm, slightly old-style serif that suits handloom
// without tipping into costume. Inter for everything functional.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Sri Guru Raghavendra Fabrics',
    template: '%s · Sri Guru Raghavendra Fabrics',
  },
  description:
    'Handloom sarees — Gadwal, Ilkal, soft silks and more — in Chikkalasandra, Bangalore. Fifteen years of buying carefully.',
  openGraph: {
    siteName: 'Sri Guru Raghavendra Fabrics',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
