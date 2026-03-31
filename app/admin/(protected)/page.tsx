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
      <header className="relative overflow-hidden rounded-[40px] border border-black/[0.04] bg-white p-10 shadow-sm">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-black" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">System Status: Active</p>
            </div>
            <h1 className="text-[3.2rem] font-black leading-[0.95] tracking-tight text-ink">
              Welcome back, <br />
              <span className="text-ink/30">Admin.</span>
            </h1>
            <p className="max-w-md text-[1rem] font-medium leading-relaxed text-ink/50">
              Manage your doctors, services, and view booking submissions below.
            </p>
          </div>

          <div className="hidden lg:block">
            {/* Stats visual removed as requested */}
          </div>
        </div>
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
          highlight
        />
      </div>

      {/* Manual Entry Quick Action */}
      <div className="rounded-[40px] border border-black/[0.04] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[1.4rem] font-bold tracking-tight text-ink">Admin Quick Actions</h3>
            <p className="mt-1 text-[0.88rem] text-ink/40 font-medium">Instantly access the most used administration tools.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/admin/submissions"
              className="rounded-full bg-black px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-black/90 active:scale-95"
            >
              Add Submission
            </Link>
            <Link 
              href="/admin/doctors"
              className="rounded-full border border-black/[0.08] bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-ink transition hover:bg-black/5 active:scale-95"
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
  highlight
}: {
  href: string;
  label: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-[40px] border border-black/[0.04] bg-white p-8 shadow-sm transition-all duration-300 hover:border-black/[0.08] hover:shadow-xl hover:shadow-black/5 ${
        highlight ? 'hover:-translate-y-2' : 'hover:-translate-y-1'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.03] text-ink transition-transform duration-500 group-hover:scale-110 group-hover:bg-black group-hover:text-white`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink/25 mb-2">{label}</p>
          <p className="text-[2.5rem] font-bold leading-none tracking-tight text-ink group-hover:tracking-tighter transition-all">{count}</p>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-bold tracking-tight text-ink group-hover:text-black">{title}</h3>
        <div className="mt-3 flex items-center gap-2 overflow-hidden">
          <span className="text-xs font-bold text-ink/40 transition-all duration-300 group-hover:text-ink">
            View details
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
    </Link>
  );
}
