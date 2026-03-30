'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Doctor } from '@/data/doctors';
import { Service } from '@/data/services';
import { BookingPayload, sendBookingEmail } from '@/lib/email';

const fieldVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 }
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  age: string;
  notes: string;
};

const initialState: FormState = {
  name: '',
  phone: '',
  email: '',
  age: '',
  notes: ''
};

type BookingFormProps = {
  service: Service | null;
  doctor: Doctor | null;
};

export function BookingForm({ service, doctor }: BookingFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const validationErrors = useMemo(() => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!formState.name.trim()) {
      errors.name = 'Name is required.';
    }

    if (!formState.phone.trim()) {
      errors.phone = 'Phone is required.';
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formState.phone.trim())) {
      errors.phone = 'Enter a valid phone number.';
    }

    if (!formState.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!formState.age.trim()) {
      errors.age = 'Age is required.';
    } else {
      const ageNumber = Number(formState.age);
      if (Number.isNaN(ageNumber) || ageNumber <= 0 || ageNumber > 120) {
        errors.age = 'Provide an age between 1 and 120.';
      }
    }

    return errors;
  }, [formState]);

  const isValid = useMemo(() => Object.keys(validationErrors).length === 0, [validationErrors]);

  const handleChange = (field: keyof FormState) => (value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormState(initialState);
    setStatus('idle');
    setErrorMessage(null);
    setShowValidation(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidation(true);

    if (!service || !doctor) {
      setErrorMessage('Select a service and a doctor before submitting.');
      return;
    }

    if (!isValid) {
      setErrorMessage('Please resolve the highlighted fields.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    const payload: BookingPayload = {
      service: service.name,
      doctor: doctor.name,
      name: formState.name.trim(),
      phone: formState.phone.trim(),
      email: formState.email.trim(),
      age: formState.age.trim(),
      notes: formState.notes.trim() || '-'
    };

    try {
      await sendBookingEmail(payload);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong while sending your request.');
      }
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="section-card p-6 text-center"
      >
        <p className="text-sm uppercase tracking-[0.4em] text-mist">Submission complete</p>
        <h3 className="mt-4 text-2xl font-semibold text-ink">Everything is set</h3>
        <p className="mt-2 text-sm text-ink/75">We received your booking request and will respond within 12 hours.</p>
        <button
          type="button"
          onClick={resetForm}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-ink/20 px-6 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-ink/5"
        >
          Book another session
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } }}
      className="section-card p-6"
      onSubmit={handleSubmit}
    >
      <div className="mb-6 space-y-1">
        <p className="text-xs uppercase tracking-[0.5em] text-mist">Step 3</p>
        <h3 className="text-2xl font-semibold text-ink md:text-3xl">Your details</h3>
        <p className="text-sm text-ink/70">Add the final details and send your booking request.</p>
      </div>
      {errorMessage ? (
        <p className="mb-4 rounded-2xl bg-sunset/20 px-4 py-3 text-sm text-ink" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Full name" error={showValidation ? validationErrors.name : null}>
          <input
            type="text"
            value={formState.name}
            onChange={(event) => handleChange('name')(event.target.value)}
            placeholder="Avery Morgan"
            className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-sage focus:outline-none"
            aria-invalid={showValidation && Boolean(validationErrors.name)}
          />
        </FieldWrapper>
        <FieldWrapper label="Phone" error={showValidation ? validationErrors.phone : null}>
          <input
            type="tel"
            value={formState.phone}
            onChange={(event) => handleChange('phone')(event.target.value)}
            placeholder="+1 415 555 1234"
            className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-sage focus:outline-none"
            aria-invalid={showValidation && Boolean(validationErrors.phone)}
          />
        </FieldWrapper>
        <FieldWrapper label="Email" error={showValidation ? validationErrors.email : null}>
          <input
            type="email"
            value={formState.email}
            onChange={(event) => handleChange('email')(event.target.value)}
            placeholder="avery@email.com"
            className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-sage focus:outline-none"
            aria-invalid={showValidation && Boolean(validationErrors.email)}
          />
        </FieldWrapper>
        <FieldWrapper label="Age" error={showValidation ? validationErrors.age : null}>
          <input
            type="number"
            min={1}
            max={120}
            value={formState.age}
            onChange={(event) => handleChange('age')(event.target.value)}
            placeholder="32"
            className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-sage focus:outline-none"
            aria-invalid={showValidation && Boolean(validationErrors.age)}
          />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Notes" className="mt-4" error={null}>
        <textarea
          value={formState.notes}
          onChange={(event) => handleChange('notes')(event.target.value)}
          rows={4}
          placeholder="Share anything you'd like us to be aware of"
          className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:border-sage focus:outline-none"
        />
      </FieldWrapper>
      <motion.button
        type="submit"
        layout
        whileTap={{ scale: 0.98 }}
        whileHover={status === 'loading' ? undefined : { scale: 1.01 }}
        className="mt-6 w-full rounded-2xl bg-ink px-6 py-3 text-base font-semibold text-white shadow-lg shadow-ink/30 transition-colors hover:bg-sage/95 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Sending...' : 'Send booking request'}
      </motion.button>
    </motion.form>
  );
}

function FieldWrapper({
  label,
  error,
  children,
  className = ''
}: {
  label: string;
  error: string | undefined | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fieldVariants}
      className={className}
    >
      <label className="text-xs uppercase tracking-[0.4em] text-mist">{label}</label>
      {children}
      {error ? <p className="mt-2 text-xs text-sunset">{error}</p> : null}
    </motion.div>
  );
}
