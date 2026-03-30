'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getStoredBookingSubmissions,
  removeStoredBookingSubmission,
  type BookingSubmission
} from '@/lib/catalog-storage';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<BookingSubmission[]>([]);

  useEffect(() => {
    setSubmissions(getStoredBookingSubmissions());
  }, []);

  const summary = useMemo(
    () => ({
      total: submissions.length,
      emailjs: submissions.filter((item) => item.deliveryMode === 'emailjs').length,
      formsubmit: submissions.filter((item) => item.deliveryMode === 'formsubmit').length,
      mailto: submissions.filter((item) => item.deliveryMode === 'mailto').length
    }),
    [submissions]
  );

  const removeSubmission = (submission: BookingSubmission) => {
    const confirmed = window.confirm(`Remove the submission from ${submission.patientName}?`);
    if (!confirmed) return;
    setSubmissions(removeStoredBookingSubmission(submission.id));
  };

  return (
    <section className="space-y-5">
      {/* Header card */}
      <div className="section-card px-6 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-mist">Submissions</p>
            <h2 className="mt-2 text-[1.6rem] font-semibold tracking-[-0.04em] text-ink">Booking request inbox</h2>
            <p className="mt-1.5 max-w-2xl text-[0.85rem] leading-relaxed text-ink/55">
              Every submitted booking appears here. Review patient details, delivery method, and manage requests.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <SummaryPill label="Total" value={summary.total} active />
            <SummaryPill label="EmailJS" value={summary.emailjs} />
            <SummaryPill label="Form" value={summary.formsubmit} />
            <SummaryPill label="Draft" value={summary.mailto} />
          </div>
        </div>
      </div>

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <div className="section-card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
              <path d="M12 15V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
            </svg>
          </div>
          <p className="mt-4 text-[0.88rem] font-medium text-ink/50">No submissions yet</p>
          <p className="mt-1 max-w-xs text-[0.82rem] text-ink/38">
            Once a patient completes a booking on the public page, their request will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <article key={submission.id} className="section-card overflow-hidden">
              {/* Row 1: Identity + status + actions */}
              <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    {/* Avatar circle */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[0.82rem] font-semibold text-ink/50">
                      {submission.patientName
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">
                        {submission.patientName}
                      </h3>
                      <p className="mt-0.5 truncate text-[0.8rem] text-ink/50">
                        {dateFormatter.format(new Date(submission.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-ink/45">
                    {submission.deliveryMode === 'emailjs'
                      ? 'Email'
                      : submission.deliveryMode === 'formsubmit'
                      ? 'Form'
                      : 'Draft'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSubmission(submission)}
                    className="rounded-full p-2 text-ink/35 transition hover:bg-black/[0.05] hover:text-ink/60"
                    aria-label={`Remove submission from ${submission.patientName}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M19 6V20C19 20.55 18.55 21 18 21H6C5.45 21 5 20.55 5 20V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Row 2: Details grid — clean, separated fields */}
              <div className="border-t border-black/[0.05] bg-black/[0.012] px-6 py-4">
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  <FieldPair label="Doctor" value={submission.doctorName} sub={submission.doctorSpecialty} />
                  <FieldPair label="Service" value={submission.serviceName} sub={submission.serviceDuration} />
                  <FieldPair label="Phone" value={submission.phone} />
                  <FieldPair label="Email" value={submission.email} />
                  <FieldPair label="Age" value={`${submission.age} years`} />
                  {submission.notes && submission.notes !== 'None provided' ? (
                    <FieldPair label="Notes" value={submission.notes} />
                  ) : (
                    <FieldPair label="Notes" value="—" />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Sub-components ─── */

function SummaryPill({ label, value, active }: { label: string; value: number; active?: boolean }) {
  return (
    <div
      className={`rounded-[14px] px-3.5 py-2.5 text-center transition ${
        active ? 'bg-black text-white' : 'bg-black/[0.03]'
      }`}
    >
      <p className={`text-[10px] uppercase tracking-[0.26em] ${active ? 'text-white/60' : 'text-mist'}`}>
        {label}
      </p>
      <p className={`mt-0.5 text-[1.1rem] font-semibold tracking-[-0.03em] ${active ? 'text-white' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  );
}

function FieldPair({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.26em] text-ink/35">{label}</p>
      <p className="mt-1 truncate text-[0.85rem] font-medium text-ink/80">{value}</p>
      {sub ? <p className="mt-0.5 truncate text-[0.78rem] text-ink/42">{sub}</p> : null}
    </div>
  );
}
