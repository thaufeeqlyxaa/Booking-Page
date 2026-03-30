'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getStoredBookingSubmissions,
  removeStoredBookingSubmission,
  updateStoredBookingSubmission,
  appendStoredBookingSubmission,
  type BookingSubmission,
  getStoredDoctors,
  getStoredServices
} from '@/lib/catalog-storage';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<BookingSubmission[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<BookingSubmission | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // For manual add form
  const doctors = getStoredDoctors();
  const services = getStoredServices();

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
    const confirmed = window.confirm(`Permanently delete the submission from ${submission.patientName}?`);
    if (!confirmed) return;
    setSubmissions(removeStoredBookingSubmission(submission.id));
  };

  const handleEdit = (submission: BookingSubmission) => {
    setEditingSubmission(submission);
  };

  const saveEdit = (updated: BookingSubmission) => {
    const next = updateStoredBookingSubmission(updated);
    setSubmissions(next);
    setEditingSubmission(null);
  };

  const handleManualAdd = (newSub: BookingSubmission) => {
    const next = appendStoredBookingSubmission(newSub);
    setSubmissions(next);
    setShowAddForm(false);
  };

  return (
    <section className="space-y-5 pb-20">
      {/* Header card */}
      <div className="rounded-[24px] border border-black/[0.05] bg-white/75 px-6 py-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] uppercase tracking-[0.42em] text-ink/35">Submissions</p>
              <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[0.7rem] font-medium text-ink/45">
                {submissions.length}
              </span>
            </div>
            <h2 className="mt-2 text-[1.6rem] font-semibold tracking-[-0.04em] text-ink">Booking request inbox</h2>
            <p className="mt-1.5 max-w-2xl text-[0.85rem] leading-relaxed text-ink/50">
              Every submitted booking appears here. Review patient details, delivery method, and manage requests.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="grid grid-cols-4 gap-2 mr-4">
              <SummaryPill label="Total" value={summary.total} active />
              <SummaryPill label="Email" value={summary.emailjs} />
              <SummaryPill label="Form" value={summary.formsubmit} />
              <SummaryPill label="Draft" value={summary.mailto} />
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-[#181818]"
            >
              + Manual entry
            </button>
          </div>
        </div>
      </div>

      {/* Submissions list */}
      {submissions.length === 0 && !showAddForm ? (
        <div className="rounded-[24px] border border-black/[0.05] bg-white/70 px-6 py-16 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
              <path d="M7 10L12 15L17 10" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
              <path d="M12 15V3" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
            </svg>
          </div>
          <p className="mt-4 text-[0.88rem] font-medium text-ink/50">No submissions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <article 
              key={submission.id} 
              className="rounded-[24px] border border-black/[0.05] bg-white/70 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-[0.82rem] font-bold text-white shadow-lg shadow-black/10">
                      {submission.patientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">
                        {submission.patientName}
                      </h3>
                      <p className="mt-0.5 truncate text-[0.8rem] text-ink/45">
                        {dateFormatter.format(new Date(submission.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="mr-2 rounded-full bg-black/[0.04] px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink/45">
                    {submission.deliveryMode}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleEdit(submission)}
                    className="rounded-full p-2 text-ink/30 transition hover:bg-black/[0.05] hover:text-ink/60"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeSubmission(submission)}
                    className="rounded-full p-2 text-ink/30 transition hover:bg-red-500/10 hover:text-red-500"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="border-t border-black/[0.04] bg-black/[0.01] px-6 py-4">
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FieldPair label="Doctor" value={submission.doctorName} sub={submission.doctorSpecialty} />
                  <FieldPair label="Service" value={submission.serviceName} sub={submission.serviceDuration} />
                  <FieldPair label="Contact" value={submission.email} sub={submission.phone} />
                  <FieldPair label="Patient Age" value={`${submission.age} years`} />
                  <div className="lg:col-span-2">
                    <FieldPair label="Patient Notes" value={submission.notes || '—'} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingSubmission && (
        <SubmissionEditModal 
          submission={editingSubmission} 
          onClose={() => setEditingSubmission(null)} 
          onSave={saveEdit} 
        />
      )}

      {/* Add Modal */}
      {showAddForm && (
        <SubmissionAddModal 
          onClose={() => setShowAddForm(false)} 
          onAdd={handleManualAdd}
          doctors={doctors}
          services={services}
        />
      )}
    </section>
  );
}

function SummaryPill({ label, value, active }: { label: string; value: number; active?: boolean }) {
  return (
    <div className={`rounded-[16px] px-3.5 py-2.5 text-center transition ${active ? 'bg-ink text-white shadow-lg' : 'bg-black/[0.03]'}`}>
      <p className={`text-[9px] uppercase tracking-[0.24em] font-medium ${active ? 'text-white/60' : 'text-ink/30'}`}>{label}</p>
      <p className={`mt-0.5 text-[1.1rem] font-semibold tracking-[-0.03em] ${active ? 'text-white' : 'text-ink'}`}>{value}</p>
    </div>
  );
}

function FieldPair({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.24em] font-medium text-ink/30">{label}</p>
      <p className="mt-1 truncate text-[0.88rem] font-medium text-ink/75">{value}</p>
      {sub ? <p className="mt-0.5 truncate text-[0.78rem] text-ink/40">{sub}</p> : null}
    </div>
  );
}

function SubmissionEditModal({ submission, onClose, onSave }: { submission: BookingSubmission, onClose: () => void, onSave: (s: BookingSubmission) => void }) {
  const [form, setForm] = useState(submission);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden">
        <h3 className="text-xl font-bold tracking-tight mb-6">Edit Submission</h3>
        <div className="space-y-4">
          <Input label="Patient Name" value={form.patientName} onChange={v => setForm({...form, patientName: v})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email} onChange={v => setForm({...form, email: v})} />
            <Input label="Phone" value={form.phone} onChange={v => setForm({...form, phone: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Age" value={form.age} onChange={v => setForm({...form, age: v})} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={v => setForm({...form, notes: v})} />
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-bold text-ink/40 hover:bg-black/5">Cancel</button>
          <button onClick={() => onSave(form)} className="px-8 py-2.5 rounded-full bg-ink text-white text-sm font-bold shadow-lg shadow-black/10">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function SubmissionAddModal({ onClose, onAdd, doctors, services }: { onClose: () => void, onAdd: (s: BookingSubmission) => void, doctors: any[], services: any[] }) {
  const [form, setForm] = useState<Partial<BookingSubmission>>({
    patientName: '',
    email: '',
    phone: '',
    age: '',
    notes: '',
    deliveryMode: 'mailto'
  });
  const [docId, setDocId] = useState(doctors[0]?.id || '');
  const [srvId, setSrvId] = useState(services[0]?.id || '');

  const handleCreate = () => {
    const doc = doctors.find(d => d.id === docId);
    const srv = services.find(s => s.id === srvId);
    if (!doc || !srv || !form.patientName) return;

    const newSub: BookingSubmission = {
      id: `manual-${Date.now()}`,
      createdAt: new Date().toISOString(),
      doctorId: doc.id,
      doctorName: doc.name,
      doctorSpecialty: doc.specialty,
      serviceId: srv.id,
      serviceName: srv.name,
      serviceDuration: srv.duration,
      patientName: form.patientName!,
      email: form.email || '',
      phone: form.phone || '',
      age: form.age || '',
      notes: form.notes || 'Manual Entry',
      deliveryMode: 'mailto',
      status: 'submitted'
    };
    onAdd(newSub);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-xl font-bold tracking-tight mb-6">New Manual Submission</h3>
        <div className="space-y-4">
          <Input label="Patient Name" value={form.patientName || ''} onChange={v => setForm({...form, patientName: v})} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Doctor" value={docId} onChange={setDocId} options={doctors.map(d => ({label: d.name, value: d.id}))} />
            <Select label="Service" value={srvId} onChange={setSrvId} options={services.map(s => ({label: s.name, value: s.id}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email || ''} onChange={v => setForm({...form, email: v})} />
            <Input label="Phone" value={form.phone || ''} onChange={v => setForm({...form, phone: v})} />
          </div>
          <Textarea label="Notes" value={form.notes || ''} onChange={v => setForm({...form, notes: v})} />
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-bold text-ink/40 hover:bg-black/5">Cancel</button>
          <button onClick={handleCreate} className="px-8 py-2.5 rounded-full bg-ink text-white text-sm font-bold shadow-lg shadow-black/10">Create Entry</button>
        </div>
      </div>
    </div>
  );
}

/* UI Components for Modal */
function Input({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold tracking-widest text-ink/20 mb-1.5 ml-1">{label}</p>
      <input 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full h-12 bg-black/[0.03] border-none rounded-[16px] px-4 font-medium text-ink focus:ring-0" 
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: {label: string, value: string}[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold tracking-widest text-ink/20 mb-1.5 ml-1">{label}</p>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full h-12 bg-black/[0.03] border-none rounded-[16px] px-4 font-medium text-ink focus:ring-0"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold tracking-widest text-ink/20 mb-1.5 ml-1">{label}</p>
      <textarea 
        rows={3}
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-black/[0.03] border-none rounded-[16px] px-4 py-3 font-medium text-ink focus:ring-0" 
      />
    </div>
  );
}
