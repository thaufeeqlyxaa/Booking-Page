'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCatalogCounts } from '@/lib/catalog-storage';

export default function AdminHomePage() {
  const [counts, setCounts] = useState({ doctors: 0, services: 0, submissions: 0 });

  useEffect(() => {
    setCounts(getCatalogCounts());
  }, []);

  const sections = [
    {
      href: '/admin/doctors',
      label: 'Doctor Management',
      description: 'Add and review doctor profiles used in the booking experience.',
      count: counts.doctors,
      countLabel: 'Doctors'
    },
    {
      href: '/admin/services',
      label: 'Service Management',
      description: 'Add and review the services patients can choose during booking.',
      count: counts.services,
      countLabel: 'Services'
    },
    {
      href: '/admin/submissions',
      label: 'Booking Submissions',
      description: 'Review incoming booking requests with patient details, doctor selection, and delivery status.',
      count: counts.submissions,
      countLabel: 'Submissions'
    }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="section-card block px-6 py-6 transition hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(0,0,0,0.08)]"
        >
          <p className="text-[11px] uppercase tracking-[0.36em] text-mist">{section.countLabel}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">{section.label}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">{section.description}</p>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="text-ink/55">{section.count} items</span>
            <span className="font-medium text-ink">Open</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
