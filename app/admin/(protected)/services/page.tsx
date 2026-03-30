'use client';

import { FormEvent, type InputHTMLAttributes, useEffect, useMemo, useState } from 'react';
import { services as defaultServices, type Service } from '@/data/services';
import { getStoredServices, saveStoredServices } from '@/lib/catalog-storage';

type ServiceFormState = {
  name: string;
  duration: string;
  description: string;
  focus: string;
  price: string;
};

const initialServiceForm: ServiceFormState = {
  name: '',
  duration: '',
  description: '',
  focus: '',
  price: ''
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminServicesPage() {
  const [serviceList, setServiceList] = useState<Service[]>(defaultServices);
  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(initialServiceForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setServiceList(getStoredServices());
  }, []);

  const nextCount = useMemo(() => serviceList.length + 1, [serviceList.length]);
  const isEditing = editingServiceId !== null;

  const updateField = (field: keyof ServiceFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setForm(initialServiceForm);
    setEditingServiceId(null);
    setError(null);
  };

  const openCreateForm = () => {
    resetForm();
    setSuccess(null);
    setShowForm(true);
  };

  const openEditForm = (service: Service) => {
    setForm({
      name: service.name,
      duration: service.duration,
      description: service.description,
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
    resetForm();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = Number(form.price);
    if (
      !form.name.trim() ||
      !form.duration.trim() ||
      !form.description.trim() ||
      !form.focus.trim() ||
      !form.price.trim()
    ) {
      setError('Add all required service details before saving.');
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      setError('Enter a valid service price.');
      return;
    }

    const nextService: Service = {
      id:
        editingServiceId ??
        `${slugify(form.name) || `service-${nextCount}`}-${Date.now().toString(36)}`,
      name: form.name.trim(),
      duration: form.duration.trim(),
      description: form.description.trim(),
      focus: form.focus.trim(),
      price
    };

    const nextServices = isEditing
      ? serviceList.map((service) => (service.id === editingServiceId ? nextService : service))
      : [nextService, ...serviceList];

    try {
      saveStoredServices(nextServices);
      setServiceList(nextServices);
      setSuccess(
        isEditing
          ? 'Service updated. The booking page now shows the latest option.'
          : 'Service saved. It now appears in the booking flow.'
      );
      setShowForm(false);
      resetForm();
    } catch {
      setError('Saving failed. Please try again.');
    }
  };

  const handleDelete = (serviceId: string) => {
    const service = serviceList.find((item) => item.id === serviceId);
    if (!service) return;

    const confirmed = window.confirm(`Delete ${service.name} from the booking page?`);
    if (!confirmed) return;

    const nextServices = serviceList.filter((item) => item.id !== serviceId);

    try {
      saveStoredServices(nextServices);
      setServiceList(nextServices);

      if (editingServiceId === serviceId) {
        closeForm();
      }

      setSuccess('Service removed.');
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
            <p className="text-[11px] uppercase tracking-[0.36em] text-mist">Services</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">Service Management</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">
              Add, edit, and delete the services patients can choose during booking, including duration, focus, and price.
            </p>
          </div>

          <button
            type="button"
            onClick={() => (showForm ? closeForm() : openCreateForm())}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#181818]"
          >
            {showForm ? 'Close Form' : 'Add Service'}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 border-t border-black/6 pt-6 md:grid-cols-2">
            <AdminField
              label="Service name"
              value={form.name}
              onChange={(value) => updateField('name', value)}
              placeholder="Mindful Clarity"
              required
            />
            <AdminField
              label="Duration"
              value={form.duration}
              onChange={(value) => updateField('duration', value)}
              placeholder="35 min"
              required
            />
            <AdminField
              label="Focus"
              value={form.focus}
              onChange={(value) => updateField('focus', value)}
              placeholder="Stress + Resilience"
              required
            />
            <AdminField
              label="Price"
              value={form.price}
              onChange={(value) => updateField('price', value)}
              placeholder="1000"
              inputMode="numeric"
              required
            />
            <div className="md:col-span-2">
              <AdminField
                label="Description"
                value={form.description}
                onChange={(value) => updateField('description', value)}
                placeholder="Short description shown on the booking page."
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
                  {isEditing ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {success ? <p className="mt-4 text-sm text-ink/60">{success}</p> : null}
      </div>

      <div className="section-card overflow-hidden">
        <div className="border-b border-black/6 px-6 py-4 text-sm text-ink/55">
          {serviceList.length} service options currently available in the booking flow.
        </div>

        {serviceList.length === 0 ? (
          <div className="px-6 py-10 text-sm text-ink/55">No services available yet. Add a service to publish it to the booking page.</div>
        ) : null}

        {serviceList.map((service, index) => (
          <div
            key={service.id}
            className={`px-6 py-5 ${index < serviceList.length - 1 ? 'border-b border-black/6' : ''}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">{service.name}</h3>
                <p className="max-w-2xl text-sm leading-relaxed text-ink/58">{service.description}</p>
                <p className="text-sm text-ink/55">{service.focus}</p>
              </div>

              <div className="space-y-3 lg:text-right">
                <div className="space-y-1 text-sm text-ink/55">
                  <p>{service.duration}</p>
                  <p className="font-medium text-ink">Rs. {service.price}</p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => openEditForm(service)}
                    className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-black/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service.id)}
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
