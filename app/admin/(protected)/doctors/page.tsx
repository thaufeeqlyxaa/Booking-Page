'use client';

import { FormEvent, type InputHTMLAttributes, useEffect, useState } from 'react';
import {
  fetchDoctors,
  insertDoctor,
  updateDoctor,
  deleteDoctor,
  uploadDoctorImage,
  type DbDoctor
} from '@/lib/supabase-api';

type DoctorFormState = {
  image_url: string;
  name: string;
  specialty: string;
  experience: string;
  bio: string;
  price: string;
  topics: string;
  file: File | null;
};

const defaultImage = '/images/doctors/doctor-1.svg';

const initialDoctorForm: DoctorFormState = {
  image_url: defaultImage,
  name: '',
  specialty: '',
  experience: '',
  bio: '',
  price: '',
  topics: '',
  file: null
};

export default function AdminDoctorsPage() {
  const [doctorList, setDoctorList] = useState<DbDoctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [form, setForm] = useState<DoctorFormState>(initialDoctorForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoading(true);
    const data = await fetchDoctors();
    setDoctorList(data);
    setLoading(false);
  }

  const isEditing = editingDoctorId !== null;

  const updateField = (field: keyof DoctorFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setForm(initialDoctorForm);
    setEditingDoctorId(null);
    setError(null);
  };

  const openCreateForm = () => {
    resetForm();
    setSuccess(null);
    setShowForm(true);
  };

  const openEditForm = (doctor: DbDoctor) => {
    setForm({
      image_url: doctor.image_url || defaultImage,
      name: doctor.name,
      specialty: doctor.specialty,
      experience: doctor.experience,
      bio: doctor.bio,
      price: String(doctor.price),
      topics: (doctor.topics ?? []).join('\n'),
      file: null
    });
    setEditingDoctorId(doctor.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setSuccess(null);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(form.price);

    if (!form.name.trim() || !form.specialty.trim() || !form.experience.trim() || !form.bio.trim() || !form.price.trim()) {
      setError('Please fill in all doctor details.');
      return;
    }
    if (Number.isNaN(price) || price <= 0) {
      setError('Required: Valid consultation fee.');
      return;
    }

    setSaving(true);
    setError(null);
    
    let finalImageUrl = form.image_url.trim() || defaultImage;

    try {
      if (form.file) {
        setSuccess('Uploading image...');
        finalImageUrl = await uploadDoctorImage(form.file);
      }
    } catch (uploadError: any) {
      setError(uploadError.message || 'Image upload failed.');
      setSaving(false);
      return;
    }

    const topicsArray = form.topics
      .split(/[,\n]/)
      .map((t: string) => t.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      experience: form.experience.trim(),
      bio: form.bio.trim(),
      image_url: finalImageUrl,
      price,
      topics: topicsArray,
    };

    if (isEditing && editingDoctorId) {
      const ok = await updateDoctor(editingDoctorId, payload);
      if (ok) {
        setSuccess('Doctor profile updated.');
        await loadDoctors();
        closeForm();
      } else {
        setError('Update failed. Please try again.');
        setSaving(false);
      }
    } else {
      const created = await insertDoctor(payload);
      if (created) {
        setSuccess('New doctor added.');
        await loadDoctors();
        closeForm();
      } else {
        setError('Save failed. Please try again.');
        setSaving(false);
      }
    }
  };

  const handleDelete = async (doctorId: string) => {
    const doctor = doctorList.find((item) => item.id === doctorId);
    if (!doctor) return;
    const confirmed = window.confirm(`Permanently remove ${doctor.name} from directory?`);
    if (!confirmed) return;

    const ok = await deleteDoctor(doctorId);
    if (ok) {
      setSuccess('Doctor removed from directory.');
      setDoctorList((prev) => prev.filter((d) => d.id !== doctorId));
    } else {
      setError('Delete failed. Please try again.');
    }
  };

  return (
    <section className="space-y-8 pb-32">
      {/* Header Block */}
      <div className="rounded-[40px] border border-black/[0.04] bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">Directory Management</p>
            </div>
            <h1 className="mt-3 text-[2.4rem] font-black tracking-tight text-ink">Doctors</h1>
            <p className="mt-2 max-w-xl text-[0.92rem] font-medium leading-relaxed text-ink/45">
              Manage your doctor profiles. Changes reflect instantly across all devices.
            </p>
          </div>

          <button
            onClick={() => (showForm ? closeForm() : openCreateForm())}
            className={`shrink-0 flex items-center justify-center gap-2 rounded-full px-8 py-4 text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${
              showForm ? 'bg-black/5 text-ink hover:bg-black/10' : 'bg-black text-white shadow-lg shadow-black/10 hover:bg-black/90'
            }`}
          >
            {showForm ? 'Cancel' : '+ Add Doctor'}
          </button>
        </div>

        {showForm && (
          <div className="mt-8 border-t border-black/[0.05] pt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Name" value={form.name} onChange={v => updateField('name', v)} placeholder="Dr. Sarah Johnson" />
                <Input label="Specialty" value={form.specialty} onChange={v => updateField('specialty', v)} placeholder="Lead Psychotherapist" />
                <Input label="Experience" value={form.experience} onChange={v => updateField('experience', v)} placeholder="12 yrs experience" />
                <Input label="Session Fee (₹)" value={form.price} onChange={v => updateField('price', v)} placeholder="1500" inputMode="numeric" />
                <div className="md:col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-ink/25 mb-2 ml-1">Profile Image</p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-black/[0.06] bg-black/[0.02]">
                      <img 
                        src={form.file ? URL.createObjectURL(form.file) : form.image_url} 
                        alt="Preview" 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                    <label className="cursor-pointer rounded-full bg-black/5 px-6 py-3 text-[0.8rem] font-bold text-ink hover:bg-black/10 transition-colors">
                      Upload New Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files?.[0]) {
                            setForm({ ...form, file: e.target.files[0] });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <Textarea label="Bio" value={form.bio} onChange={v => updateField('bio', v)} placeholder="Description of the doctor." />
              <Textarea label="Focus Tags (one per line)" value={form.topics} onChange={v => updateField('topics', v)} placeholder={"Anxiety & Stress\nCBT Therapy\nDepression"} />

              <div className="flex items-center justify-between border-t border-black/[0.05] pt-6">
                {error && <p className="text-sm font-bold text-red-500 mr-4">{error}</p>}
                {!error && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/20">All fields mandatory</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-black px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-black/10 transition-all hover:bg-black/90 active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {success && <p className="ml-4 text-sm font-bold text-emerald-600">{success}</p>}

      {/* Doctor List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-ink/40 font-semibold">Loading from Supabase...</p>
        </div>
      ) : doctorList.length === 0 ? (
        <div className="rounded-[32px] border border-black/[0.04] bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-ink/40">No doctors yet. Add your first doctor above.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {doctorList.map((doctor) => (
            <article key={doctor.id} className="group relative flex flex-col overflow-hidden rounded-[40px] border border-black/[0.04] bg-white p-6 shadow-sm transition-all duration-300 hover:border-black/[0.08] hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-black/[0.06] bg-black/[0.02] shadow-sm">
                    <img src={doctor.image_url || defaultImage} alt={doctor.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-bold tracking-tight text-ink">{doctor.name}</h3>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-ink/40 uppercase tracking-widest">{doctor.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <IconButton onClick={() => openEditForm(doctor)} icon={<EditIcon />} />
                  <IconButton onClick={() => handleDelete(doctor.id)} icon={<DeleteIcon />} isDestructive />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <MiniPill label="Experience" value={doctor.experience} />
                <MiniPill label="Fee" value={`₹ ${doctor.price}`} />
              </div>

              <p className="mt-4 text-sm text-ink/50 leading-relaxed line-clamp-2">{doctor.bio}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* UI Components */
function Input({ label, value, onChange, placeholder, inputMode }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'] }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-ink/25 mb-2 ml-1">{label}</p>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full h-12 bg-black/[0.03] border-none rounded-[18px] px-4 text-[0.92rem] font-bold text-ink placeholder:text-ink/15 transition focus:ring-2 focus:ring-black/5 outline-none"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-ink/25 mb-2 ml-1">{label}</p>
      <textarea
        rows={4}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/[0.03] border-none rounded-[22px] px-4 py-4 text-[0.92rem] font-bold text-ink placeholder:text-ink/15 transition focus:ring-2 focus:ring-black/5 outline-none resize-none"
      />
    </div>
  );
}

function MiniPill({ label, value }: { label: string, value: string }) {
  return (
    <div className="rounded-[18px] bg-black/[0.02] px-3 py-2.5">
      <p className="text-[8px] font-bold uppercase tracking-widest text-ink/20">{label}</p>
      <p className="mt-0.5 text-[0.8rem] font-bold text-ink/70 truncate">{value}</p>
    </div>
  );
}

function IconButton({ onClick, icon, isDestructive }: { onClick: () => void, icon: React.ReactNode, isDestructive?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`h-9 w-9 flex items-center justify-center rounded-full transition-colors ${isDestructive ? 'hover:bg-red-500 hover:text-white text-red-500/50' : 'hover:bg-black text-ink/30 hover:text-white'}`}>
      {icon}
    </button>
  );
}

function EditIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

function DeleteIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>;
}
