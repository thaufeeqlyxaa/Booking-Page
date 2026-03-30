'use client';

/* eslint-disable @next/next/no-img-element */

import { FormEvent, type InputHTMLAttributes, type ReactNode, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { doctors, type Doctor } from '@/data/doctors';
import { services, type Service } from '@/data/services';
import { appendStoredBookingSubmission, getStoredDoctors, getStoredServices } from '@/lib/catalog-storage';
import { sendBookingEmail } from '@/lib/email';

type BookingStep = 'service' | 'details' | 'review' | 'success';

type BookingDetails = {
  name: string;
  phone: string;
  email: string;
  age: string;
  notes: string;
};

const initialDetails: BookingDetails = {
  name: '',
  phone: '',
  email: '',
  age: '',
  notes: ''
};

const panelMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 }
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [doctorCatalog, setDoctorCatalog] = useState<Doctor[]>(doctors);
  const [serviceCatalog, setServiceCatalog] = useState<Service[]>(services);
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [previewDoctor, setPreviewDoctor] = useState<Doctor | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(services[0] ?? null);
  const [step, setStep] = useState<BookingStep>('service');
  const [details, setDetails] = useState<BookingDetails>(initialDetails);
  const [showErrors, setShowErrors] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'emailjs' | 'formsubmit' | 'mailto' | null>(null);

  useEffect(() => {
    const nextDoctors = getStoredDoctors();
    const nextServices = getStoredServices();

    setDoctorCatalog(nextDoctors);
    setServiceCatalog(nextServices);
    setSelectedService((current) => {
      if (!current) return nextServices[0] ?? null;
      return nextServices.find((service) => service.id === current.id) ?? nextServices[0] ?? null;
    });
  }, []);

  const filteredDoctors = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return doctorCatalog;

    return doctorCatalog.filter((doctor) => {
      const haystack = [doctor.name, doctor.specialty, doctor.bio, doctor.experience, ...doctor.topics]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [doctorCatalog, query]);

  const validationErrors = useMemo(() => {
    const errors: Partial<Record<keyof BookingDetails, string>> = {};

    if (!details.name.trim()) errors.name = 'Name is required.';

    if (!details.phone.trim()) {
      errors.phone = 'Phone is required.';
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(details.phone.trim())) {
      errors.phone = 'Enter a valid phone number.';
    }

    if (!details.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!details.age.trim()) {
      errors.age = 'Age is required.';
    } else {
      const ageNumber = Number(details.age);
      if (Number.isNaN(ageNumber) || ageNumber <= 0 || ageNumber > 120) {
        errors.age = 'Age must be between 1 and 120.';
      }
    }

    return errors;
  }, [details]);

  const resetBooking = () => {
    setActiveDoctor(null);
    setPreviewDoctor(null);
    setSelectedService(serviceCatalog[0] ?? null);
    setStep('service');
    setDetails(initialDetails);
    setShowErrors(false);
    setSubmitError(null);
    setSubmitState('idle');
    setDeliveryMode(null);
  };

  const beginBooking = (doctor: Doctor) => {
    setActiveDoctor(doctor);
    setPreviewDoctor(null);
    setSelectedService(serviceCatalog[0] ?? null);
    setStep('service');
    setDetails(initialDetails);
    setShowErrors(false);
    setSubmitError(null);
    setSubmitState('idle');
    setDeliveryMode(null);
  };

  const updateDetails = (field: keyof BookingDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };

  const continueToReview = () => {
    setShowErrors(true);
    if (Object.keys(validationErrors).length > 0) return;
    setStep('review');
  };

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeDoctor || !selectedService) return;

    setShowErrors(true);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitState('loading');
    setSubmitError(null);

    try {
      const result = await sendBookingEmail({
        service: selectedService.name,
        doctor: activeDoctor.name,
        name: details.name.trim(),
        phone: details.phone.trim(),
        email: details.email.trim(),
        age: details.age.trim(),
        notes: details.notes.trim() || 'None provided'
      });

      try {
        appendStoredBookingSubmission({
          id: `submission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          doctorId: activeDoctor.id,
          doctorName: activeDoctor.name,
          doctorSpecialty: activeDoctor.specialty,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          serviceDuration: selectedService.duration,
          patientName: details.name.trim(),
          phone: details.phone.trim(),
          email: details.email.trim(),
          age: details.age.trim(),
          notes: details.notes.trim() || 'None provided',
          deliveryMode: result.mode,
          status: 'submitted'
        });
      } catch (storageError) {
        console.error('Booking submission could not be recorded locally:', storageError);
      }

      setDeliveryMode(result.mode);

      // Persist submission to admin panel
      appendStoredBookingSubmission({
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        doctorId: activeDoctor.id,
        doctorName: activeDoctor.name,
        doctorSpecialty: activeDoctor.specialty,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceDuration: selectedService.duration,
        patientName: details.name.trim(),
        phone: details.phone.trim(),
        email: details.email.trim(),
        age: details.age.trim(),
        notes: details.notes.trim() || 'None provided',
        deliveryMode: result.mode,
        status: 'submitted'
      });

      setSubmitState('idle');
      setStep('success');
    } catch (error) {
      setSubmitState('error');
      setSubmitError(error instanceof Error ? error.message : 'Failed to send booking request.');
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#efefef] text-ink">
      <BackgroundOrbits />

      <header className="relative z-10 border-b border-black/6 bg-white/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.48em] text-mist">Lyxaa</p>
            <p className="mt-1 text-sm font-medium text-ink">Doctor Booking</p>
          </div>
          <div className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-ink/60">
            Minimal booking flow
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 sm:px-8 sm:py-9 lg:px-10">
        <AnimatePresence mode="wait">
          {!activeDoctor ? (
            <motion.div key="directory" {...panelMotion} transition={{ duration: 0.28 }} className="space-y-7">
              <div className="max-w-3xl space-y-2.5">
                <p className="text-[11px] uppercase tracking-[0.42em] text-mist">Directory</p>
                <h1 className="text-3xl font-semibold tracking-[-0.06em] text-ink md:text-4xl lg:text-[2.7rem]">
                  Choose your doctor first
                </h1>
                <p className="text-sm leading-relaxed text-ink/62">
                  Browse profiles, open the eye view for full doctor details, and then move through service, details, review, and submit.
                </p>
              </div>

              <div className="section-card mx-auto max-w-3xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-ink/38">
                    <SearchIcon />
                  </span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by doctor name or specialty"
                    className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink/30 focus:outline-none"
                  />
                </div>
              </div>

              {filteredDoctors.length > 0 ? (
                <motion.div
                  variants={directoryGridMotion}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredDoctors.map((doctor) => (
                    <DoctorCardRedesigned
                      key={doctor.id}
                      doctor={doctor}
                      onPreview={() => setPreviewDoctor(doctor)}
                      onBook={() => beginBooking(doctor)}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="section-card px-6 py-12 text-center">
                  <p className="text-sm text-ink/58">
                    {doctorCatalog.length === 0
                      ? 'No doctors have been added yet. Use the admin area to create profiles.'
                      : 'No doctors match that search yet.'}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="booking" {...panelMotion} transition={{ duration: 0.28 }} className="space-y-6">
              <div className="section-card overflow-hidden">
                <div className="border-b border-black/6 px-6 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.42em] text-mist">Booking flow</p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-ink">
                        Booking with {activeDoctor.name}
                      </h2>
                      <p className="mt-1 text-sm text-ink/58">{activeDoctor.specialty}</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetBooking}
                      className="rounded-full border border-black/8 px-4 py-2 text-sm text-ink/62 transition hover:bg-black/5"
                    >
                      Back to doctors
                    </button>
                  </div>
                </div>

                <div className="border-b border-black/6 px-6 py-5">
                  <StepIndicator current={step} />
                </div>

                <div className="px-6 py-6">
                  {step === 'service' ? (
                    <motion.div {...panelMotion} transition={{ duration: 0.22 }} className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.36em] text-mist">Step 1</p>
                        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Select a service</h3>
                        <p className="text-sm text-ink/62">Pick the consultation that matches your need.</p>
                      </div>

                      {serviceCatalog.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-3">
                          {serviceCatalog.map((service) => {
                            const active = selectedService?.id === service.id;

                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => setSelectedService(service)}
                                className={`rounded-[28px] border p-5 text-left transition-all ${
                                  active
                                    ? 'border-black bg-white shadow-[0_18px_42px_rgba(0,0,0,0.08)]'
                                    : 'border-black/8 bg-white/88 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,0,0,0.06)]'
                                }`}
                              >
                                <p className="text-[11px] uppercase tracking-[0.3em] text-mist">{service.duration}</p>
                                <h4 className="mt-3 text-lg font-semibold text-ink">{service.name}</h4>
                                <p className="mt-2 text-sm leading-relaxed text-ink/62">{service.description}</p>
                                <p className="mt-5 text-sm font-medium text-ink">Rs. {service.price}</p>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <InlineNotice>No services are available yet. Add them in the admin services page first.</InlineNotice>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setStep('details')}
                          disabled={!selectedService}
                          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#181818] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Continue to details
                        </button>
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 'details' ? (
                    <motion.form
                      {...panelMotion}
                      transition={{ duration: 0.22 }}
                      className="space-y-6"
                      onSubmit={(event) => event.preventDefault()}
                    >
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.36em] text-mist">Step 2</p>
                        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Your details</h3>
                        <p className="text-sm text-ink/62">Add the essentials for the booking request.</p>
                      </div>

                      {submitError ? <InlineNotice>{submitError}</InlineNotice> : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          label="Full name"
                          value={details.name}
                          onChange={(value) => updateDetails('name', value)}
                          placeholder="Avery Morgan"
                          error={showErrors ? validationErrors.name : null}
                        />
                        <FormField
                          label="Phone"
                          value={details.phone}
                          onChange={(value) => updateDetails('phone', value)}
                          placeholder="+91 98765 43210"
                          error={showErrors ? validationErrors.phone : null}
                        />
                        <FormField
                          label="Email"
                          value={details.email}
                          onChange={(value) => updateDetails('email', value)}
                          placeholder="avery@email.com"
                          error={showErrors ? validationErrors.email : null}
                        />
                        <FormField
                          label="Age"
                          value={details.age}
                          onChange={(value) => updateDetails('age', value)}
                          placeholder="32"
                          error={showErrors ? validationErrors.age : null}
                          inputMode="numeric"
                        />
                      </div>

                      <FormField
                        label="Notes"
                        value={details.notes}
                        onChange={(value) => updateDetails('notes', value)}
                        placeholder="Share anything the doctor should know"
                        multiline
                      />

                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setStep('service')}
                          className="rounded-full border border-black/8 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-black/5"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={continueToReview}
                          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#181818]"
                        >
                          Continue to review
                        </button>
                      </div>
                    </motion.form>
                  ) : null}

                  {step === 'review' && selectedService ? (
                    <motion.form {...panelMotion} transition={{ duration: 0.22 }} className="space-y-6" onSubmit={submitBooking}>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.36em] text-mist">Step 3</p>
                        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Review and submit</h3>
                        <p className="text-sm text-ink/62">Make sure everything looks right before you send it.</p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <SummaryCard label="Doctor" title={activeDoctor.name} subtitle={activeDoctor.specialty} />
                        <SummaryCard label="Service" title={selectedService.name} subtitle={`${selectedService.duration} / Rs. ${selectedService.price}`} />
                      </div>

                      <div className="rounded-[28px] border border-black/8 bg-white/86 p-5">
                        <div className="grid gap-3 md:grid-cols-2">
                          <SummaryRow label="Name" value={details.name} />
                          <SummaryRow label="Phone" value={details.phone} />
                          <SummaryRow label="Email" value={details.email} />
                          <SummaryRow label="Age" value={details.age} />
                        </div>
                        <div className="mt-4 border-t border-black/6 pt-4">
                          <p className="text-xs uppercase tracking-[0.28em] text-mist">Notes</p>
                          <p className="mt-2 text-sm text-ink/66">{details.notes || 'None provided'}</p>
                        </div>
                      </div>

                      {submitError ? <InlineNotice>{submitError}</InlineNotice> : null}

                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setStep('details')}
                          className="rounded-full border border-black/8 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-black/5"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={submitState === 'loading'}
                          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#181818] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {submitState === 'loading' ? 'Submitting...' : 'Submit booking'}
                        </button>
                      </div>
                    </motion.form>
                  ) : null}

                  {step === 'success' ? (
                    <motion.div {...panelMotion} transition={{ duration: 0.22 }} className="space-y-6 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-white">
                        ✓
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.36em] text-mist">Booking submitted</p>
                        <h3 className="text-3xl font-semibold tracking-[-0.05em] text-ink">Request sent successfully</h3>
                        <p className="mx-auto max-w-xl text-sm leading-relaxed text-ink/62">
                          {deliveryMode === 'mailto'
                            ? 'A ready-to-send draft has been opened in your email app so the booking can still be sent without direct email credentials.'
                            : 'Your booking request has been sent successfully and is ready for follow-up.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetBooking}
                        className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#181818]"
                      >
                        Book another doctor
                      </button>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <footer className="relative z-10 border-t border-black/6 bg-white/45">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-sm text-ink/55 sm:px-8 lg:px-10 md:flex-row md:items-center md:justify-between">
          <p>Lyxaa doctor booking</p>
          <p>Doctor first. Then service, details, review, and submit.</p>
        </div>
      </footer>

      <AnimatePresence>
        {previewDoctor ? (
          <DoctorPreviewModal
            doctor={previewDoctor}
            onClose={() => setPreviewDoctor(null)}
            onBook={() => beginBooking(previewDoctor)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

const directoryGridMotion = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const doctorCardMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
  }
};

function BackgroundOrbits() {
  return (
    <div className="dna-shell" aria-hidden="true">
      <div className="dna-strand left-[-40px] top-[100px]">
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
      </div>
      <div className="dna-strand bottom-[-30px] right-[-20px]">
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
        <span className="dna-rung" />
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: BookingStep }) {
  const currentIndex = ['service', 'details', 'review', 'success'].indexOf(current);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {[
        { id: 'service', label: 'Service' },
        { id: 'details', label: 'Details' },
        { id: 'review', label: 'Review' }
      ].map((item, index) => {
        const active = current === item.id;
        const complete = currentIndex > index;

        return (
          <div key={item.id} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                active || complete ? 'border-black bg-black text-white' : 'border-black/10 bg-white text-ink/35'
              }`}
            >
              {complete ? '✓' : index + 1}
            </div>
            <span className={`text-sm ${active || complete ? 'text-ink' : 'text-ink/35'}`}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DoctorCardRedesigned({
  doctor,
  onPreview,
  onBook
}: {
  doctor: Doctor;
  onPreview: () => void;
  onBook: () => void;
}) {
  const isDefaultVector =
    doctor.image.endsWith('.svg') ||
    doctor.image.includes('/images/doctors/') ||
    doctor.image.startsWith('data:image/svg+xml');

  return (
    <motion.article
      variants={doctorCardMotion}
      whileHover={{ y: -4, scale: 1.012 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex h-full flex-col rounded-[30px] border border-black/[0.06] bg-white/[0.96] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_22px_44px_rgba(0,0,0,0.08)]"
    >
      <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),transparent_34%)]" />

      {/* Header — fixed 60px so every card starts identically */}
      <div className="relative flex h-[60px] items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[1.3rem] font-semibold leading-tight tracking-[-0.05em] text-ink">
            {doctor.name}
          </h3>
          <p className="mt-1 truncate text-[0.84rem] text-ink/58">{doctor.specialty}</p>
        </div>

        <button
          type="button"
          onClick={onPreview}
          aria-label={`View ${doctor.name} details`}
          className="shrink-0 rounded-full border border-black/8 p-2.5 text-ink/60 transition hover:bg-black/5 hover:text-ink"
        >
          <EyeIcon />
        </button>
      </div>

      {/* Image — exact 1:1 square for uniform height across all cards */}
      <div className="relative mt-4 overflow-hidden rounded-[26px] border border-black/[0.04] bg-[linear-gradient(180deg,#f7f7f7,#efefef)]">
        <div className="relative aspect-square overflow-hidden rounded-[26px]">
          <img
            src={doctor.image}
            alt={doctor.name}
            className={`h-full w-full transition duration-700 group-hover:scale-[1.03] ${
              isDefaultVector ? 'object-contain p-5' : 'object-cover object-center'
            }`}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.03))]" />
        </div>
      </div>

      {/* Info — always pinned to card bottom */}
      <div className="relative mt-4 flex flex-1 flex-col justify-end">
        <div className="rounded-[22px] bg-black/[0.025] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[0.92rem] font-medium tracking-[-0.02em] text-ink">{doctor.experience}</p>
              <p className="mt-0.5 truncate text-[0.78rem] text-ink/55">{doctor.hours}</p>
            </div>
            <p className="shrink-0 text-[1rem] font-semibold tracking-[-0.02em] text-ink">Rs.&nbsp;{doctor.price}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/6 pt-3">
          <p className="truncate text-[0.8rem] text-ink/55">{doctor.slot}</p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onBook}
            className="shrink-0 rounded-full bg-[#101010] px-4 py-2.5 text-[12px] font-semibold text-white transition-colors duration-200 hover:bg-black"
          >
            Book session
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

function DoctorPreviewModal({
  doctor,
  onClose,
  onBook
}: {
  doctor: Doctor;
  onClose: () => void;
  onBook: () => void;
}) {
  const isDefaultVector =
    doctor.image.endsWith('.svg') ||
    doctor.image.includes('/images/doctors/') ||
    doctor.image.startsWith('data:image/svg+xml');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/28 px-4 py-6 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_40px_80px_rgba(0,0,0,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Gradient header with avatar + identity */}
        <div className="relative bg-gradient-to-br from-[#fafafa] to-[#f0f0f0] px-7 pb-6 pt-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06] text-ink/50 transition hover:bg-black/[0.12] hover:text-ink"
            aria-label="Close doctor details"
          >
            <CloseIcon />
          </button>

          <div className="flex items-start gap-5">
            <div
              className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[20px] border border-black/[0.06] ${
                isDefaultVector ? 'bg-[#e4e4e4] p-3' : 'bg-[#e4e4e4]'
              }`}
            >
              <img
                src={doctor.image}
                alt={doctor.name}
                className={`h-full w-full ${
                  isDefaultVector ? 'object-contain opacity-70' : 'object-cover object-center'
                }`}
              />
            </div>

            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] uppercase tracking-[0.42em] text-mist">Doctor profile</p>
              <h3 className="mt-1.5 text-[1.45rem] font-semibold leading-tight tracking-[-0.04em] text-ink">
                {doctor.name}
              </h3>
              <p className="mt-1 text-[0.85rem] text-ink/55">{doctor.specialty}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-7 py-6">
          {/* Bio */}
          <p className="text-[0.88rem] leading-[1.7] text-ink/60">{doctor.bio}</p>

          {/* Metrics 2×2 grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[18px] bg-black/[0.03] px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-mist">Experience</p>
              <p className="mt-1.5 text-[0.88rem] font-medium text-ink">{doctor.experience}</p>
            </div>
            <div className="rounded-[18px] bg-black/[0.03] px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-mist">Therapy hours</p>
              <p className="mt-1.5 text-[0.88rem] font-medium text-ink">{doctor.hours}</p>
            </div>
            <div className="rounded-[18px] bg-black/[0.03] px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-mist">Next slot</p>
              <p className="mt-1.5 text-[0.88rem] font-medium text-ink">{doctor.slot}</p>
            </div>
            <div className="rounded-[18px] bg-black/[0.03] px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-mist">Starting fee</p>
              <p className="mt-1.5 text-[0.88rem] font-medium text-ink">Rs. {doctor.price}</p>
            </div>
          </div>

          {/* Specialties */}
          {doctor.topics.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-mist">Specialties</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {doctor.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-black/[0.04] px-3 py-1.5 text-[0.78rem] text-ink/58"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Actions — equal-width buttons with clear visual hierarchy */}
          <div className="flex items-center gap-3 border-t border-black/[0.06] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-black/8 py-3 text-center text-[0.85rem] font-semibold text-ink/68 transition hover:bg-black/[0.04]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onBook}
              className="flex-1 rounded-full bg-[#101010] py-3 text-center text-[0.85rem] font-semibold text-white transition hover:bg-black"
            >
              Book this doctor
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  error,
  multiline,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
  multiline?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.3em] text-mist">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder={placeholder}
          className="mt-2 w-full rounded-[20px] border border-black/8 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black/25 focus:outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="mt-2 w-full rounded-[20px] border border-black/8 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black/25 focus:outline-none"
        />
      )}
      {error ? <p className="mt-2 text-xs text-ink/55">{error}</p> : null}
    </div>
  );
}

function SummaryCard({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-mist">{label}</p>
      <p className="mt-3 text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink/65">{subtitle}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-black/[0.02] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.25em] text-mist">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-black/6 pb-3">
      <dt className="text-[11px] uppercase tracking-[0.28em] text-mist">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

function InlineNotice({ children }: { children: ReactNode }) {
  return <p className="rounded-[18px] bg-black/5 px-4 py-3 text-sm text-ink">{children}</p>;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.4 12C4.3 8.7 7.6 6.5 12 6.5S19.7 8.7 21.6 12C19.7 15.3 16.4 17.5 12 17.5S4.3 15.3 2.4 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
