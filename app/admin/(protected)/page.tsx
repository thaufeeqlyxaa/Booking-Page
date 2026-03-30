'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCatalogCounts } from '@/lib/catalog-storage';

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState({ doctors: 0, services: 0, submissions: 0 });

  useEffect(() => {
    setCounts(getCatalogCounts());
  }, []);

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Header */}
      <header className="relative overflow-hidden rounded-[40px] border border-black/[0.04] bg-white/70 p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur-3xl">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">System Status: Active</p>
            </div>
            <h1 className="text-[3.2rem] font-black leading-[0.95] tracking-[-0.07em] text-ink">
              Welcome back, <br />
              <span className="text-ink/30">Administrator.</span>
            </h1>
            <p className="max-w-md text-[1rem] font-medium leading-relaxed text-ink/50">
              Your platform is performing optimally. Manage your directory and review incoming requests below.
            </p>
          </div>

          <div className="hidden lg:block">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-16 rounded-full border-4 border-white bg-black/[0.03] backdrop-blur-md" />
              ))}
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-ink text-[0.85rem] font-black text-white shadow-xl">
                +{counts.doctors}
              </div>
            </div>
          </div>
        </div>

        {/* Abstract background elements */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-ink/[0.02] blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-ink/[0.01] blur-2xl" />
      </header>

      {/* Quick Navigation / Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NavCard
          href="/admin/doctors"
          label="Directory"
          title="Doctors"
          count={counts.doctors}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          }
          color="bg-blue-500/10 text-blue-600"
        />
        <NavCard
          href="/admin/services"
          label="Catalog"
          title="Services"
          count={counts.services}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18" />
              <path d="M7 15h.01" />
              <path d="M11 15h.01" />
            </svg>
          }
          color="bg-purple-500/10 text-purple-600"
        />
        <NavCard
          href="/admin/submissions"
          label="Activity"
          title="Submissions"
          count={counts.submissions}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
          color="bg-emerald-500/10 text-emerald-600"
          highlight
        />
      </div>

      {/* Manual Entry Quick Action */}
      <div className="rounded-[40px] border border-black/[0.04] bg-white/70 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] backdrop-blur-3xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[1.4rem] font-bold tracking-[-0.03em] text-ink">Admin Quick Actions</h3>
            <p className="mt-1 text-[0.88rem] text-ink/40 font-medium">Instantly access the most used administration tools.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/admin/submissions"
              className="rounded-full bg-ink px-6 py-3 text-[0.82rem] font-bold uppercase tracking-widest text-white shadow-xl shadow-black/10 transition hover:bg-black"
            >
              Log Manual Entry
            </Link>
            <Link 
              href="/admin/doctors"
              className="rounded-full border border-black/[0.08] bg-white px-6 py-3 text-[0.82rem] font-bold uppercase tracking-widest text-ink transition hover:bg-black/5"
            >
              Add Doctor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavCard({
  href,
  label,
  title,
  count,
  icon,
  color,
  highlight
}: {
  href: string;
  label: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-[40px] border border-black/[0.04] bg-white/70 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] backdrop-blur-3xl transition-all duration-300 hover:border-black/[0.08] hover:shadow-[0_24px_64px_rgba(0,0,0,0.06)] ${
        highlight ? 'hover:-translate-y-2' : 'hover:-translate-y-1'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ${color} transition-transform duration-500 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink/25">{label}</p>
          <p className="mt-1 text-[2.2rem] font-black leading-none tracking-[-0.05em] text-ink">{count}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-[1.5rem] font-bold tracking-[-0.04em] text-ink group-hover:text-black">{title}</h3>
        <div className="mt-3 flex items-center gap-2 overflow-hidden">
          <span className="text-[0.82rem] font-bold text-ink/35 transition-all duration-300 group-hover:text-ink/60">
            View directory
          </span>
          <svg
            className="h-4 w-4 transform text-ink/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-ink"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Decorative gradient hit */}
      <div className="absolute inset-0 z-[-1] rounded-[40px] opacity-0 transition-opacity duration-300 group-hover:bg-gradient-to-br group-hover:from-white/50 group-hover:to-transparent group-hover:opacity-100" />
    </Link>
  );
}
