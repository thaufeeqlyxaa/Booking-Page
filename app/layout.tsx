import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { appendFile } from 'node:fs/promises';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lyxaa Doctor Booking',
  description: 'Ultra-clean doctor booking flow crafted for Lyxaa with serene, premium interactions.',
  metadataBase: new URL('https://lyxaa.example.com')
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // #region agent log
  if (process.env.NODE_ENV === 'development') {
    try {
      const host = headers().get('host') ?? null;
      const LOG_PATH = '/Users/lyxaa/Documents/Booking Page/.cursor/debug-b05b66.log';
      const payload = {
        sessionId: 'b05b66',
        runId: 'initial',
        hypothesisId: 'H1',
        location: 'app/layout.tsx:RootLayout',
        message: 'RootLayout render',
        data: {
          host,
          emailjsServiceIdPresent: Boolean(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID),
          emailjsTemplateIdPresent: Boolean(process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID),
          emailjsPublicKeyPresent: Boolean(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY)
        },
        timestamp: Date.now()
      };

      // Always write directly to the workspace log file for runtime evidence.
      void appendFile(LOG_PATH, `${JSON.stringify(payload)}\n`).catch(() => {});

      fetch('http://127.0.0.1:7941/ingest/8a3a8471-8ced-44fb-a8cc-87e5d488348b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'b05b66'
        },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {
      // ignore logging failures; never block rendering
    }
  }
  // #endregion

  return (
    <html lang="en">
      <body className="bg-horizon text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
