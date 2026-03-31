import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
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
    <main className="min-h-screen bg-white text-ink selection:bg-black selection:text-white">
      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <header className="sticky top-6 z-50 flex items-center justify-between rounded-[28px] border border-black/[0.03] bg-white/80 p-3 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3 pl-2 transition-transform hover:scale-105 active:scale-95">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Image src="/logo.svg" alt="Lyxaa" width={48} height={48} className="object-contain" />
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 ml-4 py-1.5 px-1.5 bg-black/[0.03] rounded-full">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-black uppercase tracking-widest text-ink/40 transition-all hover:text-ink hover:bg-white active:scale-95"
                >
                  <NavIcon icon={link.icon} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-6 py-3 rounded-full bg-black/[0.03] text-[10px] font-black uppercase tracking-widest text-ink/40 hover:bg-black hover:text-white transition-all hidden sm:block"
            >
              View Website
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-red-500/[0.03] text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </form>
          </div>
        </header>

        <div className="mt-12 mb-8 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-emerald-500/5 border border-emerald-500/10">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Secure Session</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink/20">© 2026 Lyxaa</p>
        </div>

        <div className="pb-24">{children}</div>
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

