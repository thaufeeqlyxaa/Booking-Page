import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  sanitizeAdminNextPath,
  validateAdminCredentials,
  verifyAdminSessionToken
} from '@/lib/admin-auth';

type AdminLoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const nextPath = sanitizeAdminNextPath(searchParams?.next);
  const sessionToken = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (verifyAdminSessionToken(sessionToken)) {
    redirect(nextPath);
  }

  async function loginAction(formData: FormData) {
    'use server';

    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '');
    const target = sanitizeAdminNextPath(String(formData.get('next') || '/admin'));

    if (!validateAdminCredentials(username, password)) {
      redirect(`/admin/login?error=invalid&next=${encodeURIComponent(target)}`);
    }

    cookies().set({
      name: ADMIN_SESSION_COOKIE,
      value: createAdminSessionToken(),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12
    });

    redirect(target);
  }

  const showError = searchParams?.error === 'invalid';

  return (
    <main className="min-h-screen bg-[#efefef] text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_minmax(0,420px)]">
          <section className="section-card px-6 py-6 sm:px-8 sm:py-8">
            <p className="text-[11px] uppercase tracking-[0.42em] text-mist">Admin access</p>
            <h1 className="mt-3 text-[2.7rem] font-semibold tracking-[-0.06em] text-ink">Secure admin login</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/60">
              Sign in to manage doctors, services, and the booking content shown to patients.
            </p>

            <div className="mt-8 rounded-[28px] border border-black/8 bg-white/86 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-mist">Protected pages</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {['Overview', 'Doctors', 'Services', 'Submissions'].map((label) => (
                  <div key={label} className="rounded-[20px] bg-black/[0.03] px-4 py-4 text-sm text-ink/60">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-card px-6 py-6 sm:px-8 sm:py-8">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.36em] text-mist">Login</p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Enter admin credentials</h2>
              <p className="text-sm text-ink/60">Only the authorized admin user can access these pages.</p>
            </div>

            {showError ? (
              <p className="mt-5 rounded-[18px] bg-black/5 px-4 py-3 text-sm text-ink">
                Incorrect username or password. Please try again.
              </p>
            ) : null}

            <form action={loginAction} className="mt-6 space-y-4">
              <input type="hidden" name="next" value={nextPath} />

              <LoginField label="Username" name="username" placeholder="admin" />
              <LoginField label="Password" name="password" placeholder="password" type="password" />

              <button
                type="submit"
                className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#181818]"
              >
                Sign in
              </button>
            </form>

            <Link
              href="/"
              className="mt-5 inline-flex items-center rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-ink/62 transition hover:bg-black/5"
            >
              Back to booking
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

function LoginField({
  label,
  name,
  placeholder,
  type = 'text'
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.28em] text-mist">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={name}
        className="mt-2 w-full rounded-[20px] border border-black/8 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black/20 focus:outline-none"
      />
    </label>
  );
}
