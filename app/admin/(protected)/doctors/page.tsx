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
  const [doctorList, setDoctorList] = useState<Doctor[]>(defaultDoctors);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [form, setForm] = useState<DoctorFormState>(initialDoctorForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageLabel, setImageLabel] = useState('Default image');
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
    setImageLabel('Default image');
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
    setImageLabel(doctor.image.startsWith('data:') ? 'Uploaded image selected' : 'Current image');
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
    if (
      !form.name.trim() ||
      !form.specialty.trim() ||
      !form.experience.trim() ||
      !form.bio.trim() ||
      !form.hours.trim() ||
      !form.slot.trim() ||
      !form.price.trim()
    ) {
      setError('Add all required doctor details before saving.');
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      setError('Enter a valid consultation fee.');
      return;
    }

    const nextDoctor: Doctor = {
      id:
        editingDoctorId ??
        `${slugify(form.name) || `doctor-${nextCount}`}-${Date.now().toString(36)}`,
      image: form.image.trim() || defaultImage,
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      experience: form.experience.trim(),
      bio: form.bio.trim(),
      hours: form.hours.trim(),
      topics: form.topics
        .split(',')
        .map((topic) => topic.trim())
        .filter(Boolean),
      slot: form.slot.trim(),
      price
    };

    const nextDoctors = isEditing
      ? doctorList.map((doctor) => (doctor.id === editingDoctorId ? nextDoctor : doctor))
      : [nextDoctor, ...doctorList];

    try {
      saveStoredDoctors(nextDoctors);
      setDoctorList(nextDoctors);
      setSuccess(
        isEditing
          ? 'Doctor updated. The booking page now shows the latest profile.'
          : 'Doctor saved. The booking page now shows this doctor.'
      );
      setShowForm(false);
      resetForm();
    } catch {
      setError('Saving failed. Please try again with a smaller image.');
    }
  };

  const handleDelete = (doctorId: string) => {
    const doctor = doctorList.find((item) => item.id === doctorId);
    if (!doctor) return;

    const confirmed = window.confirm(`Delete ${doctor.name} from the booking page?`);
    if (!confirmed) return;

    const nextDoctors = doctorList.filter((item) => item.id !== doctorId);

    try {
      saveStoredDoctors(nextDoctors);
      setDoctorList(nextDoctors);

      if (editingDoctorId === doctorId) {
        closeForm();
      }

      setSuccess('Doctor removed.');
      setError(null);
    } catch {
      setError('Delete failed. Please try again.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="section-card px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.36em] text-mist">Doctors</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">Doctor Management</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">
              Add, edit, and delete doctor profiles. Uploaded images, qualification, specialties, and bio appear in the booking page and eye-button doctor view.
            </p>
          </div>

          <button
            type="button"
            onClick={() => (showForm ? closeForm() : openCreateForm())}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#181818]"
          >
            {showForm ? 'Close Form' : 'Add Doctor'}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 border-t border-black/6 pt-6 md:grid-cols-2">
            <div className="md:col-span-2 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="aspect-[4/5] overflow-hidden rounded-[24px] border border-black/8 bg-black/[0.03]">
                  <img
                    src={form.image || defaultImage}
                    alt={form.name || 'Doctor preview'}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.28em] text-mist">Doctor image</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#181818]"
                    >
                      {isUploading ? 'Uploading...' : 'Upload image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('image', defaultImage);
                        setImageLabel('Default image');
                      }}
                      className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-black/5"
                    >
                      Use default
                    </button>
                  </div>
                  <p className="text-sm text-ink/55">{imageLabel}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <AdminField
                  label="Full name"
                  value={form.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="Dr. Ayesha Thomas"
                  required
                />
                <AdminField
                  label="Qualification / Position"
                  value={form.specialty}
                  onChange={(value) => updateField('specialty', value)}
                  placeholder="Consultant Psychologist"
                  required
                />
                <AdminField
                  label="Experience"
                  value={form.experience}
                  onChange={(value) => updateField('experience', value)}
                  placeholder="9 yrs experience"
                  required
                />
                <AdminField
                  label="Therapy hours"
                  value={form.hours}
                  onChange={(value) => updateField('hours', value)}
                  placeholder="2800+ therapy hours"
                  required
                />
                <AdminField
                  label="Next slot"
                  value={form.slot}
                  onChange={(value) => updateField('slot', value)}
                  placeholder="Today, 6:15 PM"
                  required
                />
                <AdminField
                  label="Consultation fee"
                  value={form.price}
                  onChange={(value) => updateField('price', value)}
                  placeholder="1200"
                  inputMode="numeric"
                  required
                />
                <AdminField
                  label="Specialties"
                  value={form.topics}
                  onChange={(value) => updateField('topics', value)}
                  placeholder="Anxiety, Trauma, Burnout"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <AdminField
                label="Doctor details"
                value={form.bio}
                onChange={(value) => updateField('bio', value)}
                placeholder="Short profile shown in the booking quick view."
                multiline
                required
              />
            </div>

            {error ? <p className="md:col-span-2 text-sm text-ink/60">{error}</p> : null}

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-sm text-ink/55">Changes update the booking page immediately.</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full border border-black/8 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#181818]"
                >
                  {isEditing ? 'Update Doctor' : 'Save Doctor'}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {success ? <p className="mt-4 text-sm text-ink/60">{success}</p> : null}
      </div>

      <div className="section-card overflow-hidden">
        <div className="border-b border-black/6 px-6 py-4 text-sm text-ink/55">
          {doctorList.length} doctor profiles currently available in the booking flow.
        </div>

        {doctorList.length === 0 ? (
          <div className="px-6 py-10 text-sm text-ink/55">No doctors available yet. Add a doctor to publish them to the booking page.</div>
        ) : null}

        {doctorList.map((doctor, index) => (
          <div
            key={doctor.id}
            className={`px-6 py-5 ${index < doctorList.length - 1 ? 'border-b border-black/6' : ''}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-[20px] bg-black/5">
                  <img src={doctor.image} alt={doctor.name} className="h-full w-full object-cover" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">{doctor.name}</h3>
                  <p className="text-sm text-ink/58">{doctor.specialty}</p>
                  <p className="text-sm text-ink/55">{doctor.experience}</p>
                  <p className="max-w-2xl text-sm leading-relaxed text-ink/58">{doctor.bio}</p>
                  {doctor.topics.length > 0 ? (
                    <p className="text-xs uppercase tracking-[0.22em] text-mist">{doctor.topics.join(' · ')}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 lg:text-right">
                <div className="space-y-1 text-sm text-ink/55">
                  <p>{doctor.hours}</p>
                  <p>{doctor.slot}</p>
                  <p className="font-medium text-ink">Rs. {doctor.price}</p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => openEditForm(doctor)}
                    className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-black/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doctor.id)}
                    className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#181818]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  required,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  required?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.28em] text-mist">
        {label}
        {required ? ' *' : ''}
      </label>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="mt-2 w-full rounded-[20px] border border-black/8 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black/20 focus:outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="mt-2 w-full rounded-[20px] border border-black/8 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black/20 focus:outline-none"
        />
      )}
    </div>
  );
}
