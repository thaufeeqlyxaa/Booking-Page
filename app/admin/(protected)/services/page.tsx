'use client';

import { FormEvent, type InputHTMLAttributes, useEffect, useState } from 'react';
import { services as defaultServices, type Service } from '@/data/services';
import { getStoredServices, saveStoredServices } from '@/lib/catalog-storage';

type ServiceFormState = {
  name: string;
  description: string;
  duration: string;
  focus: string;
  price: string;
};

const initialServiceForm: ServiceFormState = {
  name: '',
  description: '',
  duration: '',
  focus: '',
  price: ''
};

export default function AdminServicesPage() {
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(initialServiceForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setServiceList(getStoredServices());
  }, []);

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

  const openEditForm = (service: Service) => {
    setForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      focus: service.focus,
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = Number(form.price);
    if (!form.name.trim() || !form.description.trim() || !form.duration.trim() || !form.focus.trim() || !form.price.trim()) {
      setError('Required: Complete all clinical service protocol fields.');
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      setError('Required: Valid service fee.');
      return;
    }

    const nextService: Service = {
      id: editingServiceId ?? `srv-${Date.now().toString(36)}`,
      name: form.name.trim(),
      description: form.description.trim(),
      duration: form.duration.trim(),
      focus: form.focus.trim(),
      price
    };

    const nextServices = isEditing
      ? serviceList.map((s) => (s.id === editingServiceId ? nextService : s))
      : [nextService, ...serviceList];

    try {
      saveStoredServices(nextServices);
      setServiceList(nextServices);
      setSuccess(isEditing ? 'Service catalog updated.' : 'New service initialized.');
      setShowForm(false);
      setForm(initialServiceForm);
      setEditingServiceId(null);
    } catch {
      setError('Persistence failed.');
    }
  };

  const handleDelete = (serviceId: string) => {
    const service = serviceList.find((item) => item.id === serviceId);
    if (!service) return;

    const confirmed = window.confirm(`Permanently remove ${service.name} from catalog?`);
    if (!confirmed) return;

    const nextServices = serviceList.filter((item) => item.id !== serviceId);
    try {
      saveStoredServices(nextServices);
      setServiceList(nextServices);
      if (editingServiceId === serviceId) closeForm();
      setSuccess('Service removed.');
      setError(null);
    } catch {
      setError('Operation failed.');
    }
  };

  return (
    <section className="space-y-8 pb-32">
      {/* Dynamic Header */}
      <div className="rounded-[40px] border border-black/[0.04] bg-white/70 p-8 shadow-[0_2px_16px_rgba(0,0,0,0.02)] backdrop-blur-3xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">Catalog Management</p>
            </div>
            <h1 className="mt-3 text-[2.4rem] font-black tracking-[-0.06em] text-ink">Treatment Modalities</h1>
            <p className="mt-2 max-w-xl text-[0.92rem] font-medium leading-relaxed text-ink/45">
              Refine your therapeutic offering. Adjust durations, focal areas, and pricing models.
            </p>
          </div>

          <button
            onClick={() => (showForm ? closeForm() : openCreateForm())}
            className={`shrink-0 flex items-center gap-2 rounded-full px-8 py-4 text-[0.85rem] font-bold uppercase tracking-widest transition-all duration-300 ${
              showForm ? 'bg-black/5 text-ink hover:bg-black/10' : 'bg-ink text-white shadow-xl shadow-black/10 hover:bg-black'
            }`}
          >
            {showForm ? 'Cancel Operation' : '+ Add Modality'}
          </button>
        </div>

        {showForm && (
          <div className="mt-8 border-t border-black/[0.05] pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <Input label="Protocol name" value={form.name} onChange={v => updateField('name', v)} placeholder="Clinical Assessment" />
                <Input label="Session Duration" value={form.duration} onChange={v => updateField('duration', v)} placeholder="45 minutes" />
                <Input label="Session Price" value={form.price} onChange={v => updateField('price', v)} placeholder="1000" inputMode="numeric" />
              </div>
              <Input label="Treatment Focus" value={form.focus} onChange={v => updateField('focus', v)} placeholder="Cognitive Diagnostics" />
              <Textarea label="Modality Description" value={form.description} onChange={v => updateField('description', v)} placeholder="Detailed overview of the therapeutic protocol." />
              
              <div className="flex items-center justify-between border-t border-black/[0.05] pt-6">
                {error && <p className="text-sm font-bold text-red-500 mr-4">{error}</p>}
                {!error && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/20">All metadata required</p>}
                <button type="submit" className="rounded-full bg-ink px-10 py-4 text-[0.85rem] font-black uppercase tracking-widest text-white shadow-xl shadow-black/10 transition-all hover:bg-black">
                  {isEditing ? 'Commit Changes' : 'Initialize Modality'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {success && <p className="ml-4 text-sm font-bold text-emerald-600">{success}</p>}

      {/* Services List Display */}
      <div className="grid gap-6 md:grid-cols-2 xlg:grid-cols-3">
        {serviceList.map((service) => (
          <article key={service.id} className="group relative flex flex-col rounded-[40px] border border-black/[0.04] bg-white/70 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] backdrop-blur-3xl transition-all duration-500 hover:border-black/[0.1] hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink/20 mb-2">{service.duration}</p>
                <h3 className="text-[1.4rem] font-bold tracking-[-0.03em] text-ink leading-tight">{service.name}</h3>
                <p className="mt-2 text-[0.8rem] font-bold text-ink/40 uppercase tracking-widest">{service.focus}</p>
              </div>

              <div className="flex flex-col gap-1 opacity-10 transition-opacity duration-300 group-hover:opacity-100">
                <IconButton onClick={() => openEditForm(service)} icon={<EditIcon />} />
                <IconButton onClick={() => handleDelete(service.id)} icon={<DeleteIcon />} isDestructive />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[0.92rem] leading-relaxed text-ink/50 py-4 border-y border-black/[0.03]">{service.description}</p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-ink/10" />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-ink/30">Active Protocol</p>
              </div>
              <p className="text-[1.3rem] font-black tracking-[-0.05em] text-ink">₹ {service.price}</p>
            </div>
          </article>
        ))}
      </div>
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

function IconButton({ onClick, icon, isDestructive }: { onClick: () => void, icon: React.ReactNode, isDestructive?: boolean }) {
  return (
    <button onClick={onClick} className={`h-10 w-10 flex items-center justify-center rounded-full transition-all ${isDestructive ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-black/5 text-ink/30 hover:text-ink'}`}>
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
