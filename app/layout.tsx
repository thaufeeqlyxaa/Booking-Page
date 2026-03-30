import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lyxaa Doctor Booking',
  description: 'Ultra-clean doctor booking flow crafted for Lyxaa with serene, premium interactions.',
  metadataBase: new URL('https://lyxaa.example.com')
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-horizon text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
