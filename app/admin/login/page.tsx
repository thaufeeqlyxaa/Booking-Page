'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f8f8]" />}>
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
    <main className="relative flex min-h-screen items-center justify-center bg-[#fcfcfc] px-6 selection:bg-black selection:text-white overflow-hidden">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-ink/5 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-[440px]"
      >
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[20px] bg-ink text-white shadow-2xl shadow-black/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-[2.6rem] font-black tracking-[-0.06em] text-ink">Secure Access</h1>
          <p className="mt-2 text-[0.95rem] font-bold text-ink/30 uppercase tracking-[0.2em]">Lyxaa CRM OS v1.0</p>
        </div>

        <div className="rounded-[42px] border border-black/[0.04] bg-white/72 p-10 shadow-[0_40px_100px_rgba(0,0,0,0.08)] backdrop-blur-3xl">
          <div className="mb-8 flex items-center justify-between border-b border-black/[0.05] pb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-ink/25">Environment</p>
              <p className="text-[0.9rem] font-bold text-ink">Administrator</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <LoginField label="Admin Identity" name="username" placeholder="admin" autofocus />
            <LoginField label="Access Protocol" name="password" placeholder="password" type="password" />

            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl bg-red-500/5 px-4 py-3 text-[0.82rem] font-bold text-red-500"
                >
                  Access Denied: Invalid credentials provided.
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full overflow-hidden rounded-full bg-ink py-4 text-[0.85rem] font-black uppercase tracking-[0.2em] text-white transition-all active:scale-[0.98] ${loading ? 'opacity-50' : 'hover:bg-black hover:shadow-2xl hover:shadow-black/20'}`}
            >
              {loading ? 'Verifying...' : 'Initialize Session'}
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
            Public Gateway
          </Link>
        </div>

        <div className="mt-12 text-center text-[9px] font-bold uppercase tracking-[0.4em] text-ink/15">
          © 2026 Lyxaa Digital Instruments. Secure Sandbox.
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

