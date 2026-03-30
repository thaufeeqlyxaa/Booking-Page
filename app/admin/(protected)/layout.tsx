import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: 'grid' },
  { href: '/admin/doctors', label: 'Doctors', icon: 'user' },
  { href: '/admin/services', label: 'Services', icon: 'layers' },
  { href: '/admin/submissions', label: 'Submissions', icon: 'inbox' }
];

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'grid':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
      );
    case 'user':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21C4 17 7.6 14 12 14s8 3 8 7" strokeLinecap="round" />
        </svg>
      );
    case 'layers':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case 'inbox':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 12h-6l-2 3H10l-2-3H2" />
          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const sessionToken = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifyAdminSessionToken(sessionToken)) {
    redirect('/admin/login');
  }

  async function logoutAction() {
    'use server';

    cookies().set({
      name: ADMIN_SESSION_COOKIE,
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0
    });

    redirect('/admin/login');
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-ink">
      <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8 lg:px-10">
        {/* Top bar */}
        <header className="flex items-center justify-between rounded-[22px] border border-black/[0.05] bg-white/80 px-5 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.5em] text-ink/35">Lyxaa</p>
              <p className="text-[0.82rem] font-semibold tracking-[-0.02em] text-ink">Admin</p>
            </div>

            <div className="h-5 w-px bg-black/[0.08]" />

            <nav className="flex items-center gap-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] text-ink/55 transition hover:bg-black/[0.04] hover:text-ink/80"
                >
                  <NavIcon icon={link.icon} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-black/[0.06] px-3.5 py-1.5 text-[0.78rem] text-ink/50 transition hover:bg-black/[0.04] hover:text-ink/70"
            >
              Booking page
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full bg-ink px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#181818]"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}
