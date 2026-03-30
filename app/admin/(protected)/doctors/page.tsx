'use client';

/* eslint-disable @next/next/no-img-element */

import {
  ChangeEvent,
  FormEvent,
  type InputHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { doctors as defaultDoctors, type Doctor } from '@/data/doctors';
import { getStoredDoctors, saveStoredDoctors } from '@/lib/catalog-storage';

type DoctorFormState = {
  image: string;
  name: string;
  specialty: string;
  experience: string;
  bio: string;
  hours: string;
  topics: string;
  slot: string;
  price: string;
};

const defaultImage = '/images/doctors/doctor-1.svg';

const initialDoctorForm: DoctorFormState = {
  image: defaultImage,
  name: '',
  specialty: '',
  experience: '',
  bio: '',
  hours: '',
  topics: '',
  slot: '',
  price: ''
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Image upload could not be read.'));
    };
    reader.onerror = () => reject(new Error('Image upload failed.'));
    reader.readAsDataURL(file);
  });
}

export default function AdminDoctorsPage() {
  const [doctorList, setDoctorList] = useState<Doctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [form, setForm] = useState<DoctorFormState>(initialDoctorForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageLabel, setImageLabel] = useState('Default asset');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDoctorList(getStoredDoctors());
  }, []);

  const isEditing = editingDoctorId !== null;
  const nextCount = useMemo(() => doctorList.length + 1, [doctorList.length]);

  const updateField = (field: keyof DoctorFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setForm(initialDoctorForm);
    setEditingDoctorId(null);
    setError(null);
    setIsUploading(false);
    setImageLabel('Default asset');
  };

  const openCreateForm = () => {
    resetForm();
    setSuccess(null);
    setShowForm(true);
  };

  const openEditForm = (doctor: Doctor) => {
    setForm({
      image: doctor.image,
      name: doctor.name,
      specialty: doctor.specialty,
      experience: doctor.experience,
      bio: doctor.bio,
      hours: doctor.hours,
      topics: doctor.topics.join(', '),
      slot: doctor.slot,
      price: String(doctor.price)
    });
    setEditingDoctorId(doctor.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
    setImageLabel(doctor.image.startsWith('data:') ? 'Custom upload active' : 'Asset selected');
  };

  const closeForm = () => {
    setShowForm(false);
    setSuccess(null);
    resetForm();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Please upload an image smaller than 2MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const dataUrl = await readImageAsDataUrl(file);
      updateField('image', dataUrl);
      setImageLabel(file.name);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = Number(form.price);
    if (!form.name.trim() || !form.specialty.trim() || !form.experience.trim() || !form.bio.trim() || !form.hours.trim() || !form.slot.trim() || !form.price.trim()) {
      setError('Required: Complete all clinical fields.');
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      setError('Required: Valid consultation fee.');
      return;
    }

    const nextDoctor: Doctor = {
      id: editingDoctorId ?? `${slugify(form.name) || `doc-${nextCount}`}-${Date.now().toString(36)}`,
      image: form.image.trim() || defaultImage,
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      experience: form.experience.trim(),
      bio: form.bio.trim(),
      hours: form.hours.trim(),
      topics: form.topics.split(',').map((t) => t.trim()).filter(Boolean),
      slot: form.slot.trim(),
      price
    };

    const nextDoctors = isEditing
      ? doctorList.map((d) => (d.id === editingDoctorId ? nextDoctor : d))
      : [nextDoctor, ...doctorList];

    try {
      saveStoredDoctors(nextDoctors);
      setDoctorList(nextDoctors);
      setSuccess(isEditing ? 'Directory updated successfully.' : 'New doctor added to directory.');
      setShowForm(false);
      resetForm();
    } catch {
      setError('Persistence failed. Try optimized image size.');
    }
  };

  const handleDelete = (doctorId: string) => {
    const doctor = doctorList.find((item) => item.id === doctorId);
    if (!doctor) return;

    const confirmed = window.confirm(`Permanently remove ${doctor.name} from directory?`);
    if (!confirmed) return;

    const nextDoctors = doctorList.filter((item) => item.id !== doctorId);
    try {
      saveStoredDoctors(nextDoctors);
      setDoctorList(nextDoctors);
      if (editingDoctorId === doctorId) closeForm();
      setSuccess('Doctor removed from directory.');
      setError(null);
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <section className="space-y-8 pb-32">
      {/* Header Block */}
      <div className="rounded-[40px] border border-black/[0.04] bg-white/70 p-8 shadow-[0_2px_16px_rgba(0,0,0,0.02)] backdrop-blur-3xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">Directory Management</p>
            </div>
            <h1 className="mt-3 text-[2.4rem] font-black tracking-[-0.06em] text-ink">Clinical Personnel</h1>
            <p className="mt-2 max-w-xl text-[0.92rem] font-medium leading-relaxed text-ink/45">
              Sync doctor profiles, availability, and session pricing with the live booking interface.
            </p>
          </div>

          <button
            onClick={() => (showForm ? closeForm() : openCreateForm())}
            className={`shrink-0 flex items-center gap-2 rounded-full px-8 py-4 text-[0.85rem] font-bold uppercase tracking-widest transition-all duration-300 ${
              showForm ? 'bg-black/5 text-ink hover:bg-black/10' : 'bg-ink text-white shadow-xl shadow-black/10 hover:bg-black'
            }`}
          >
            {showForm ? 'Cancel Operation' : '+ Add Specialist'}
          </button>
        </div>

        {showForm && (
          <div className="mt-8 border-t border-black/[0.05] pt-8">
            <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[240px_1fr]">
              {/* Image Column */}
              <div className="space-y-4">
                <div className="aspect-[3/4] overflow-hidden rounded-[32px] border border-black/[0.06] bg-black/[0.02]">
                  <img src={form.image} alt="Preview" className="h-full w-full object-cover grayscale-[0.2] transition-all hover:grayscale-0" />
                </div>
                <div className="space-y-3">
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-ink/25">{imageLabel}</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full bg-ink/5 py-2.5 text-[0.75rem] font-bold text-ink hover:bg-ink/10">
                      {isUploading ? '...' : 'Upload'}
                    </button>
                    <button type="button" onClick={() => updateField('image', defaultImage)} className="rounded-full bg-ink/5 py-2.5 text-[0.75rem] font-bold text-ink hover:bg-ink/10">
                      Default
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Input label="Full identity" value={form.name} onChange={v => updateField('name', v)} placeholder="Dr. Sarah Johnson" />
                  <Input label="Clinical Specialty" value={form.specialty} onChange={v => updateField('specialty', v)} placeholder="Lead Psychotherapist" />
                  <Input label="Experience Level" value={form.experience} onChange={v => updateField('experience', v)} placeholder="12 Years Clinical" />
                  <Input label="Therapy Volume" value={form.hours} onChange={v => updateField('hours', v)} placeholder="4000+ Session Hours" />
                  <Input label="Next Open Slot" value={form.slot} onChange={v => updateField('slot', v)} placeholder="Tomorrow, 10:00 AM" />
                  <Input label="Session Fee" value={form.price} onChange={v => updateField('price', v)} placeholder="1500" inputMode="numeric" />
                </div>
                <Input label="Areas of Focus (Comma separated)" value={form.topics} onChange={v => updateField('topics', v)} placeholder="Stress, OCD, Family Therapy" />
                <Textarea label="Specialist Profile" value={form.bio} onChange={v => updateField('bio', v)} placeholder="Executive bio for patient review." />
                
                <div className="flex items-center justify-between border-t border-black/[0.05] pt-6">
                  {error && <p className="text-sm font-bold text-red-500 mr-4">{error}</p>}
                  {!error && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/20">All fields mandatory</p>}
                  <button type="submit" className="rounded-full bg-ink px-10 py-4 text-[0.85rem] font-black uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all hover:bg-black">
                    {isEditing ? 'Commit Changes' : 'Initialize Specialist'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {success && <p className="ml-4 text-sm font-bold text-emerald-600">{success}</p>}

      {/* Specialist List Grid */}
      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {doctorList.map((doctor) => (
          <article key={doctor.id} className="group relative flex flex-col overflow-hidden rounded-[40px] border border-black/[0.04] bg-white/70 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] backdrop-blur-3xl transition-all duration-500 hover:border-black/[0.1] hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-black/[0.06] bg-black/[0.02] shadow-sm">
                  <img src={doctor.image} alt={doctor.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-[1.15rem] font-bold tracking-[-0.03em] text-ink">{doctor.name}</h3>
                  <p className="mt-0.5 truncate text-[0.82rem] font-medium text-ink/40 uppercase tracking-wider">{doctor.specialty}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <IconButton onClick={() => openEditForm(doctor)} icon={<EditIcon />} />
                <IconButton onClick={() => handleDelete(doctor.id)} icon={<DeleteIcon />} isDestructive />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniPill label="Exp" value={doctor.experience} />
              <MiniPill label="Hours" value={doctor.hours} />
              <MiniPill label="Price" value={`₹ ${doctor.price}`} />
              <MiniPill label="Slot" value={doctor.slot} />
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5 overflow-hidden max-h-[64px]">
              {doctor.topics.slice(0, 3).map(t => (
                <span key={t} className="rounded-full bg-ink/[0.03] px-3 py-1.5 text-[0.72rem] font-bold text-ink/40">#{t}</span>
              ))}
              {doctor.topics.length > 3 && <span className="text-[0.72rem] font-bold text-ink/20 pt-1.5">+{doctor.topics.length - 3} more</span>}
            </div>
          </article>
        ))}
      </div>
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
        className="w-full h-12 bg-black/[0.03] border-none rounded-[18px] px-4 text-[0.92rem] font-bold text-ink placeholder:text-ink/15 transition focus:ring-2 focus:ring-ink/5" 
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
        className="w-full bg-black/[0.03] border-none rounded-[22px] px-4 py-4 text-[0.92rem] font-bold text-ink placeholder:text-ink/15 transition focus:ring-2 focus:ring-ink/5" 
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
    <button onClick={onClick} className={`h-9 w-9 flex items-center justify-center rounded-full transition-colors ${isDestructive ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-black/5 text-ink/30 hover:text-ink'}`}>
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
