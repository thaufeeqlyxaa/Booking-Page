'use client';

import { FormEvent, type InputHTMLAttributes, useEffect, useState } from 'react';
import {
  fetchServices,
  insertService,
  updateService,
  deleteService,
  type DbService
} from '@/lib/supabase-api';

type ServiceFormState = {
  name: string;
  description: string;
  duration: string;
  price: string;
};

const initialServiceForm: ServiceFormState = {
  name: '',
  description: '',
  duration: '',
  price: ''
};

export default function AdminServicesPage() {
  const [serviceList, setServiceList] = useState<DbService[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(initialServiceForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    const data = await fetchServices();
    setServiceList(data);
    setLoading(false);
  }

  const isEditing = editingServiceId !== null;

  const updateField = (field: keyof ServiceFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const openCreateForm = () => {
    setForm(initialServiceForm);
    setEditingServiceId(null);
    setShowForm(true);
    setSuccess(null);
  };

  const openEditForm = (service: DbService) => {
    setForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: String(service.price)
    });
    setEditingServiceId(service.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setSuccess(null);
    setForm(initialServiceForm);
    setEditingServiceId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(form.price);

    if (!form.name.trim() || !form.description.trim() || !form.duration.trim() || !form.price.trim()) {
      setError('Please fill in all service details.');
      return;
    }
    if (Number.isNaN(price) || price <= 0) {
      setError('Required: Valid service fee.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      duration: form.duration.trim(),
      price,
    };

    if (isEditing && editingServiceId) {
      const ok = await updateService(editingServiceId, payload);
      if (ok) {
        setSuccess('Service updated.');
        await loadServices();
        closeForm();
      } else {
        setError('Update failed. Please try again.');
      }
    } else {
      const created = await insertService(payload);
      if (created) {
        setSuccess('New service added.');
        await loadServices();
        closeForm();
      } else {
        setError('Save failed. Please try again.');
      }
    }

    setSaving(false);
  };

  const handleDelete = async (serviceId: string) => {
    const service = serviceList.find((item) => item.id === serviceId);
    if (!service) return;
    const confirmed = window.confirm(`Permanently remove "${service.name}" from catalog?`);
    if (!confirmed) return;

    const ok = await deleteService(serviceId);
    if (ok) {
      setSuccess('Service removed.');
      setServiceList((prev) => prev.filter((s) => s.id !== serviceId));
    } else {
      setError('Delete failed. Please try again.');
    }
  };

  return (
    <section className="space-y-8 pb-32">
      {/* Header */}
      <div className="rounded-[40px] border border-black/[0.04] bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">Services</p>
            </div>
            <h1 className="mt-3 text-[2.4rem] font-black tracking-tight text-ink">Services</h1>
            <p className="mt-2 max-w-xl text-[0.92rem] font-medium leading-relaxed text-ink/45">
              Manage the services your clinic offers. Changes reflect instantly across all devices.
            </p>
          </div>

          <button
            onClick={() => (showForm ? closeForm() : openCreateForm())}
            className={`shrink-0 flex items-center justify-center gap-2 rounded-full px-8 py-4 text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${
              showForm ? 'bg-black/5 text-ink hover:bg-black/10' : 'bg-black text-white shadow-lg shadow-black/10 hover:bg-black/90'
            }`}
          >
            {showForm ? 'Cancel' : '+ Add Service'}
          </button>
        </div>

        {showForm && (
          <div className="mt-8 border-t border-black/[0.05] pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <Input label="Service Name" value={form.name} onChange={v => updateField('name', v)} placeholder="Consultation" />
                <Input label="Session Duration" value={form.duration} onChange={v => updateField('duration', v)} placeholder="45 min" />
                <Input label="Session Price (₹)" value={form.price} onChange={v => updateField('price', v)} placeholder="1000" inputMode="numeric" />
              </div>
              <Textarea label="Description" value={form.description} onChange={v => updateField('description', v)} placeholder="Description of the service." />

              <div className="flex items-center justify-between border-t border-black/[0.05] pt-6">
                {error && <p className="text-sm font-bold text-red-500 mr-4">{error}</p>}
                {!error && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/20">All fields required</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-black px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-black/10 transition-all hover:bg-black/90 active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {success && <p className="ml-4 text-sm font-bold text-emerald-600">{success}</p>}

      {/* Services List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-ink/40 font-semibold">Loading from Supabase...</p>
        </div>
      ) : serviceList.length === 0 ? (
        <div className="rounded-[32px] border border-black/[0.04] bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-ink/40">No services yet. Add your first service above.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceList.map((service) => (
            <article key={service.id} className="group relative flex flex-col rounded-[40px] border border-black/[0.04] bg-white p-8 shadow-sm transition-all duration-300 hover:border-black/[0.08] hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink/20 mb-2">{service.duration}</p>
                  <h3 className="text-xl font-bold tracking-tight text-ink leading-tight">{service.name}</h3>
                </div>

                <div className="flex flex-col gap-1 opacity-10 transition-opacity duration-300 group-hover:opacity-100">
                  <IconButton onClick={() => openEditForm(service)} icon={<EditIcon />} />
                  <IconButton onClick={() => handleDelete(service.id)} icon={<DeleteIcon />} isDestructive />
                </div>
              </div>

              <div className="mt-6 flex-1">
                <p className="text-sm leading-relaxed text-ink/50 py-4 border-y border-black/[0.03]">{service.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-black/10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-ink/30">Active</p>
                </div>
                <p className="text-[1.3rem] font-bold tracking-tight text-ink">₹ {service.price}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* Internal Components */
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

function IconButton({ onClick, icon, isDestructive }: { onClick: () => void, icon: React.ReactNode, isDestructive?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`h-10 w-10 flex items-center justify-center rounded-full transition-all ${isDestructive ? 'hover:bg-red-500 hover:text-white text-red-500/50' : 'hover:bg-black text-ink/30 hover:text-white'}`}>
      {icon}
    </button>
  );
}

function EditIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

function DeleteIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>;
}
