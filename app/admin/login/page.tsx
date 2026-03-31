'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginFormContainer />
    </Suspense>
  );
}

function LoginFormContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('error') === 'invalid');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(false);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username'));
    const password = String(formData.get('password'));

    // Server-side action simulation with fetch to keep it client-side responsive
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.refresh();
        router.push(searchParams.get('next') || '/admin');
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-6 selection:bg-black selection:text-white overflow-hidden">

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-[440px]"
      >
        <div className="mb-10 text-center">
          <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center">
            <img src="/logo.svg" alt="Lyxaa" className="h-full w-full object-contain" />
          </div>
        </div>

        <div className="rounded-[42px] border border-black/[0.04] bg-white p-10 shadow-sm">
          <div className="mb-8 flex items-center justify-between border-b border-black/[0.05] pb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-ink/25">Role</p>
              <p className="text-[0.9rem] font-bold text-ink">Admin</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <LoginField label="Username" name="username" placeholder="admin" autofocus />
            <LoginField label="Password" name="password" placeholder="password" type="password" />

            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl bg-red-500/5 px-4 py-3 text-[0.82rem] font-bold text-red-500"
                >
                  Invalid username or password.
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full overflow-hidden rounded-full bg-ink py-4 text-[0.85rem] font-black uppercase tracking-[0.2em] text-white transition-all active:scale-[0.98] ${loading ? 'opacity-50' : 'hover:bg-black hover:shadow-2xl hover:shadow-black/20'}`}
            >
              {loading ? 'Logging in...' : 'Login'}
              {!loading && (
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              )}
            </button>
          </form>

          <Link
            href="/"
            className="mt-8 flex items-center justify-center gap-2 text-[0.78rem] font-bold uppercase tracking-widest text-ink/30 transition hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Booking Page
          </Link>
        </div>

        <div className="mt-12 text-center text-[9px] font-bold uppercase tracking-[0.4em] text-ink/15">
          © 2026 Lyxaa.
        </div>
      </motion.div>
    </main>
  );
}

function LoginField({
  label,
  name,
  placeholder,
  type = 'text',
  autofocus = false
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  autofocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="ml-1 text-[9px] font-black uppercase tracking-[0.25em] text-ink/25">{label}</p>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoFocus={autofocus}
        required
        autoComplete={name}
        className="h-14 w-full rounded-[20px] bg-black/[0.03] px-5 text-[0.95rem] font-bold text-ink placeholder:text-ink/15 focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
      />
    </div>
  );
}

