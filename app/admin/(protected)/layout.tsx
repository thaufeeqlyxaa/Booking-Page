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
    <main className="min-h-screen bg-[#f7f7f7] text-ink selection:bg-black selection:text-white">
      {/* Dynamic Aura Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-ink/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12">
        {/* Futuristic Floating Navigation Dock */}
        <header className="sticky top-6 z-[100] flex items-center justify-between rounded-[32px] border border-white/40 bg-white/72 px-6 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-3xl">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white shadow-lg shadow-black/15 transition group-hover:scale-105">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="hidden md:block">
                <h1 className="text-[13px] font-black uppercase tracking-[0.25em] text-ink">Admin OS</h1>
                <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[0.1em]">Control Portal</p>
              </div>
            </Link>

            <div className="h-6 w-px bg-black/[0.06] hidden md:block" />

            <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[0.8rem] font-bold tracking-tight text-ink/40 transition-all hover:bg-black/5 hover:text-ink active:scale-95"
                >
                  <NavIcon icon={link.icon} />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-5 py-2.5 text-[0.78rem] font-black uppercase tracking-widest text-ink/50 transition hover:bg-black hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="hidden sm:inline">Launch Web</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/5 text-red-500 transition hover:bg-red-500 hover:text-white"
                title="Sign out"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </form>
          </div>
        </header>

        {/* Global System Status - Futuristic Microtag */}
        <div className="mt-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3 rounded-full bg-black/[0.04] px-4 py-1.5 backdrop-blur-md border border-black/[0.01]">
            <div className="flex h-1.5 w-1.5 items-center justify-center">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ink/40">Secure Session Active</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink/20">© 2026 Lyxaa Digital Instruments</p>
          </div>
        </div>

        {/* Main Content Space */}
        <div className="mt-8 pb-32">{children}</div>
      </div>
    </main>
  );
}

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'grid':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>;
    case 'user':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'layers':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>;
    case 'inbox':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>;
    default:
      return null;
  }
}

