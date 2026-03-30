import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

const adminLinks = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/doctors', label: 'Doctors' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/submissions', label: 'Submissions' }
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
    <main className="min-h-screen bg-[#efefef] text-ink">
      <div className="mx-auto max-w-6xl px-6 py-6 sm:px-8 lg:px-10">
        <header className="section-card px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.42em] text-mist">Admin</p>
              <h1 className="text-[2.6rem] font-semibold tracking-[-0.06em] text-ink">Manage booking content</h1>
              <p className="max-w-3xl text-sm leading-relaxed text-ink/60">
                A simple internal space for managing doctors, services, and submitted booking requests, with room for API or CRM integration later.
              </p>

              <nav className="flex flex-wrap gap-3 pt-2">
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-black/8 bg-white/85 px-4 py-2 text-sm text-ink/68 transition hover:bg-black/5"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex h-fit items-center rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-ink/62 transition hover:bg-black/5"
              >
                Back to booking
              </Link>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-fit items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#181818]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}
