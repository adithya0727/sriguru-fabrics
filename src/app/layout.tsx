import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sri Guru Raya Fabrics',
  description:
    'Handloom sarees — Gadwal, Ilkal and soft silks — in Chikkalasandra, Bangalore.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
