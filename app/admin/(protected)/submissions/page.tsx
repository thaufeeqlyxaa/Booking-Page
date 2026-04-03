'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Doctor, type Service } from '@/lib/supabase';

type BookingSubmission = {
  id: string;
  createdAt: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: string;
  patientName: string;
  phone: string;
  email: string;
  age: string;
  notes: string;
  deliveryMode: 'emailjs' | 'formsubmit' | 'mailto';
  status: 'submitted';
};

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<BookingSubmission[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<BookingSubmission | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then((r) => r.json())
      .then((json) => { if (json.submissions) setSubmissions(json.submissions); })
      .catch(console.error);

    fetch('/api/admin/doctors')
      .then((r) => r.json())
      .then((json) => { if (json.doctors) setDoctors(json.doctors); })
      .catch(console.error);

    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((json) => { if (json.services) setServices(json.services); })
      .catch(console.error);
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

    fetch(`/api/admin/bookings?id=${encodeURIComponent(submission.id)}`, { method: 'DELETE' })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { console.error(json.error); return; }
        setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      })
      .catch(console.error);
  };

  const handleEdit = (submission: BookingSubmission) => {
    setEditingSubmission(submission);
  };

  const saveEdit = (updated: BookingSubmission) => {
    fetch('/api/admin/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission: updated })
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { console.error(json.error); return; }
        setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setEditingSubmission(null);
      })
      .catch(console.error);
  };

  const handleManualAdd = (newSub: BookingSubmission) => {
    fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission: newSub })
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { console.error(json.error); return; }
        setSubmissions((prev) => [newSub, ...prev]);
        setShowAddForm(false);
      })
      .catch(console.error);
  };

  return (
    <section className="space-y-5 pb-20">
      {/* Header card */}
      <div className="rounded-[32px] border border-black/[0.04] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-ink/35">Submissions</p>
            </div>
            <h2 className="mt-3 text-[2rem] font-bold tracking-tight text-ink">Bookings Inbox</h2>
            <p className="mt-1.5 max-w-2xl text-[0.85rem] font-medium leading-relaxed text-ink/50">
              Manage all your booking requests and submissions here.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-4 lg:flex-nowrap">
            <div className="grid grid-cols-4 gap-2 mr-0 lg:mr-4">
              <SummaryPill label="Total" value={summary.total} active />
              <SummaryPill label="Email" value={summary.emailjs} />
              <SummaryPill label="Form" value={summary.formsubmit} />
              <SummaryPill label="Draft" value={summary.mailto} />
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="shrink-0 rounded-full bg-black px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-black/90 active:scale-95 shadow-lg shadow-black/10"
            >
              + Add Submission
            </button>
          </div>
        </div>
      </div>

      {/* Submissions list */}
      {submissions.length === 0 && !showAddForm ? (
        <div className="rounded-[32px] border border-black/[0.04] bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black/[0.03]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
              <path d="M7 10L12 15L17 10" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
              <path d="M12 15V3" strokeLinecap="round" strokeLinejoin="round" className="text-ink/30" />
            </svg>
          </div>
          <p className="mt-4 text-[0.88rem] font-medium text-ink/50">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <article 
              key={submission.id} 
              className="group rounded-[32px] border border-black/[0.04] bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:border-black/[0.08]"
            >
              <div className="flex items-start justify-between gap-4 px-8 py-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-[0.9rem] font-bold text-white shadow-lg shadow-black/10">
                      {submission.patientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold tracking-tight text-ink">
                        {submission.patientName}
                      </h3>
                      <p className="mt-1 truncate text-xs font-bold text-ink/40 uppercase tracking-widest">
                        {dateFormatter.format(new Date(submission.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 opacity-60 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="mr-3 rounded-full bg-black/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">
                    {submission.deliveryMode}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleEdit(submission)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-ink/30 transition hover:bg-black/5 hover:text-ink/80"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeSubmission(submission)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-ink/30 transition hover:bg-red-500 hover:text-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="border-t border-black/[0.04] bg-black/[0.01] px-8 py-6">
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className={`rounded-xl px-4 py-3 text-center transition-all ${active ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-black/[0.03]'}`}>
      <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${active ? 'text-white/40' : 'text-ink/30'}`}>{label}</p>
      <p className={`mt-0.5 text-xl font-bold tracking-tight ${active ? 'text-white' : 'text-ink'}`}>{value}</p>
    </div>
  );
}

function FieldPair({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-ink/30">{label}</p>
      <p className="mt-1.5 truncate text-[0.92rem] font-bold text-ink">{value}</p>
      {sub ? <p className="mt-0.5 truncate text-xs font-bold text-ink/40">{sub}</p> : null}
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
          <button onClick={onClose} className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-ink/40 hover:bg-black/5 transition-all">Cancel</button>
          <button onClick={() => onSave(form)} className="px-8 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-black/90 active:scale-95 transition-all">Save Changes</button>
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
        <h3 className="text-xl font-bold tracking-tight mb-6">Add Submission</h3>
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
          <button onClick={onClose} className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-ink/40 hover:bg-black/5 transition-all">Cancel</button>
          <button onClick={handleCreate} className="px-8 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-black/90 active:scale-95 transition-all">Add</button>
        </div>
      </div>
    </div>
  );
}

/* UI Components for Modal */
function Input({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-ink/20 mb-1.5 ml-1">{label}</p>
      <input 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full h-12 bg-black/[0.03] border-none rounded-[16px] px-4 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-black/5 transition-all" 
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: {label: string, value: string}[] }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-ink/20 mb-1.5 ml-1">{label}</p>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full h-12 bg-black/[0.03] border-none rounded-[16px] px-4 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-black/5 transition-all"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-ink/20 mb-1.5 ml-1">{label}</p>
      <textarea 
        rows={3}
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-black/[0.03] border-none rounded-[16px] px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none" 
      />
    </div>
  );
}
