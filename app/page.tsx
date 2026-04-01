'use client';

/* eslint-disable @next/next/no-img-element */

import { FormEvent, type InputHTMLAttributes, type ReactNode, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { doctors, type Doctor } from '@/data/doctors';
import { services, type Service } from '@/data/services';
import { appendStoredBookingSubmission } from '@/lib/catalog-storage';
import { fetchDoctors, fetchServices, insertBooking } from '@/lib/supabase';
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
    async function loadCatalog() {
      const [nextDoctors, nextServices] = await Promise.all([fetchDoctors(), fetchServices()]);

      // Fall back to static data if Supabase returns nothing (tables not yet seeded)
      const finalDoctors = nextDoctors.length > 0 ? nextDoctors : doctors;
      const finalServices = nextServices.length > 0 ? nextServices : services;

      setDoctorCatalog(finalDoctors);
      setServiceCatalog(finalServices);
      setSelectedService((current) => {
        if (!current) return finalServices[0] ?? null;
        return finalServices.find((s) => s.id === current.id) ?? finalServices[0] ?? null;
      });
    }

    loadCatalog();
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
    if (submitState === 'loading') return;
    if (!activeDoctor || !selectedService) return;

    setShowErrors(true);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitState('loading');
    setSubmitError(null);

    try {
      console.log('Sending booking email with payload:', {
        service: selectedService.name,
        doctor: activeDoctor.name,
        name: details.name.trim(),
        phone: details.phone.trim()
      });

      const result = await sendBookingEmail({
        service: selectedService.name,
        doctor: activeDoctor.name,
        name: details.name.trim(),
        phone: details.phone.trim(),
        email: details.email.trim(),
        age: details.age.trim(),
        notes: details.notes.trim() || 'None provided'
      });

      console.log('Booking email sent successfully:', result);

      const bookingId = `submission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const bookingTimestamp = new Date().toISOString();

      // Insert into Supabase (primary record)
      try {
        await insertBooking({
          id: bookingId,
          created_at: bookingTimestamp,
          // original schema column
          name: details.name.trim(),
          phone: details.phone.trim(),
          email: details.email.trim(),
          age: details.age.trim(),
          notes: details.notes.trim() || 'None provided',
          doctor_id: activeDoctor.id,
          service_id: selectedService.id,
          // extended columns (present after ALTER TABLE migration)
          patient_name: details.name.trim(),
          doctor_name: activeDoctor.name,
          doctor_specialty: activeDoctor.specialty,
          service_name: selectedService.name,
          service_duration: selectedService.duration,
          delivery_mode: result.mode,
          status: 'submitted'
        });
      } catch (supabaseError) {
        console.error('Booking could not be saved to Supabase:', supabaseError);
      }

      // Also keep a local copy as fallback log
      try {
        appendStoredBookingSubmission({
          id: bookingId,
          createdAt: bookingTimestamp,
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
        console.error('Booking could not be recorded locally:', storageError);
      }

      setDeliveryMode(result.mode);

      setSubmitState('idle');

      if (result.mode === 'mailto') {
        setSubmitError('Primary email service not configured. Opening your email app to finish booking...');
        setTimeout(() => setSubmitError(null), 8000);
      } else {
        setStep('success');
      }
    } catch (error: any) {
      console.error('Submission final level error:', error);
      setSubmitState('error');
      
      const details = error?.message || (typeof error === 'string' ? error : 'Failed to send booking request.');
      setSubmitError(`${details} (Please try again or contact support).`);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-ink">
      <header className="relative z-10 border-b border-black/6 bg-white/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Lyxaa" className="h-9 object-contain" />
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 sm:px-8 sm:py-9 lg:px-10">
        <AnimatePresence mode="wait">
          {!activeDoctor ? (
            <motion.div key="directory" {...panelMotion} transition={{ duration: 0.28 }} className="space-y-10">
              <div className="max-w-xl space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-mist">Provider Directory</p>
                <h1 className="text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">
                  Connect with your specialist.
                </h1>
                <p className="text-sm font-medium leading-relaxed text-ink/40">
                  Select a provider below to view qualifications, clinical focus, and session availability. 
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
                    <SuccessState onReset={resetBooking} />
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {previewDoctor ? (
          <DoctorPreviewModal
            doctor={previewDoctor}
            onClose={() => setPreviewDoctor(null)}
            onBook={() => beginBooking(previewDoctor)}
          />
        ) : null}
      </AnimatePresence>

      <Footer />
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-black/[0.04] bg-white p-2.5 shadow-[0_2px_18px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_30px_60px_rgba(0,0,0,0.09)]"
    >
      <button
        type="button"
        onClick={onPreview}
        className="relative block aspect-[4/4.8] w-full overflow-hidden rounded-[24px] bg-[#f7f7f9] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
        aria-label={`View ${doctor.name} profile`}
      >
        <img
          src={doctor.image}
          alt={doctor.name}
          className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-110 ${
            isDefaultVector ? 'p-10 object-contain' : 'object-cover object-center'
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-ink shadow-sm">
          Verified
        </div>
      </button>

      <div className="flex flex-1 flex-col px-3 pb-2 pt-5">
        <div>
          <h3 className="text-lg font-extrabold leading-tight tracking-tight text-ink">{doctor.name}</h3>
          <p className="mt-0.5 text-xs font-bold text-ink/35">{doctor.specialty}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/55">{doctor.bio}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {doctor.topics.slice(0, 2).map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-black/8 bg-black/[0.02] px-2.5 py-1 text-[10px] font-semibold text-ink/60"
            >
              {topic}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black/[0.03] pt-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-ink/20">Experience</p>
            <p className="mt-0.5 text-[12px] font-black text-ink/65">{doctor.experience}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-ink/20">Session</p>
            <p className="mt-0.5 text-[12px] font-black text-ink/65">₹{doctor.price}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-ink/70 transition hover:border-black/20 hover:bg-black/[0.02]"
          >
            View Profile
          </button>
          <button
            type="button"
            onClick={onBook}
            className="rounded-2xl bg-black px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[0.99] active:scale-95"
          >
            Book Now
          </button>
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
  const shouldReduceMotion = useReducedMotion();
  const isDefaultVector =
    doctor.image.endsWith('.svg') ||
    doctor.image.includes('/images/doctors/') ||
    doctor.image.startsWith('data:image/svg+xml');

  const overlayInitial = shouldReduceMotion ? { opacity: 1 } : { opacity: 0 };
  const overlayExit = shouldReduceMotion ? { opacity: 0 } : { opacity: 0 };
  const modalInitial = shouldReduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.985, y: 14 };
  const modalExit = shouldReduceMotion ? { opacity: 0, scale: 1, y: 0 } : { opacity: 0, scale: 0.99, y: 10 };
  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.26, ease: [0.16, 1, 0.3, 1] };

  return (
    <motion.div
      initial={overlayInitial}
      animate={{ opacity: 1 }}
      exit={overlayExit}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 px-4 py-6 backdrop-blur-3xl"
      onClick={onClose}
    >
      <motion.div
        initial={modalInitial}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={modalExit}
        transition={motionTransition}
        className="relative w-full max-w-[650px] max-h-[90vh] overflow-hidden rounded-[42px] border border-black/[0.04] bg-white shadow-[0_50px_120px_rgba(0,0,0,0.22)] flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.10] bg-white/70 text-ink/60 backdrop-blur-md transition hover:bg-white/90 hover:text-ink/80"
        >
          <CloseIcon />
        </button>

        <div className="relative w-full sm:w-[260px] h-[240px] sm:h-auto overflow-hidden bg-[#fafafa] flex-shrink-0">
          <img
            src={doctor.image}
            alt={doctor.name}
            className={`h-full w-full ${isDefaultVector ? 'object-contain p-12' : 'object-cover object-center'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent sm:hidden" />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-8 sm:px-10 py-8 min-h-0 custom-scrollbar">
            <div className="inline-block rounded-full bg-black/5 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-black/40">
              Verified Specialist
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink leading-tight">{doctor.name}</h2>
            <p className="text-sm font-bold text-ink/30 mb-8">{doctor.specialty}</p>

            <div className="grid grid-cols-2 gap-2 mb-10">
              <MetricBlock label="Experience" value={doctor.experience} />
              <MetricBlock label="Session Fee" value={`₹ ${doctor.price}`} />
              <MetricBlock label="Languages" value={doctor.languages} />
            </div>

            <div className="space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ink/20 leading-none">Clinical Summary</p>
              <p className="text-[0.9rem] leading-relaxed text-ink/50 font-medium">{doctor.bio}</p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-black/[0.03] px-8 sm:px-10 py-6 flex items-center justify-between gap-4">
            <div className="hidden lg:block whitespace-nowrap">
              <p className="text-[9px] font-black uppercase tracking-widest text-ink/25">Official Care</p>
              <p className="mt-0.5 text-[10px] font-bold text-ink/40">Lyxaa Provider Network</p>
            </div>
            <motion.button
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              onClick={onBook}
              className="w-full sm:w-auto rounded-2xl bg-black py-4 px-10 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-black/10"
            >
              Secure Booking
            </motion.button>
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


function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-black/[0.02] border border-black/[0.015] px-5 py-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-ink/30">{label}</p>
      <p className="mt-1.5 text-[0.92rem] font-bold text-ink">{value}</p>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = 'https://lyxaa.com';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 text-center py-10"
    >
      <div className="relative mx-auto h-24 w-24">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
          className="flex h-full w-full items-center justify-center rounded-full bg-black text-white shadow-2xl shadow-black/20"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-black/10"
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-mist">Confirmed</p>
        <h3 className="text-4xl font-bold tracking-tight text-ink">Booking Successful</h3>
        <p className="mx-auto max-w-md text-[0.95rem] font-medium leading-relaxed text-ink/50">
          Your request has been received. Redirecting to home page in <span className="text-ink font-bold tabular-nums">{countdown}s</span>...
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-black/5 px-8 py-4 text-xs font-black uppercase tracking-widest text-ink transition hover:bg-black/10"
        >
          Book another doctor
        </button>
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-black/[0.05] bg-white/40 pb-16 pt-16 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-center md:items-start">
            <img src="/logo.svg" alt="Lyxaa" className="h-10 object-contain" />
            <p className="mt-4 text-sm text-ink/40 max-w-[280px]">
              Premium medical booking platform. Built for minimalist performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:justify-end">
            <a href="#" className="text-sm font-medium text-ink/50 transition hover:text-ink">Legal</a>
            <a href="#" className="text-sm font-medium text-ink/50 transition hover:text-ink">Privacy</a>
            <a href="#" className="text-sm font-medium text-ink/50 transition hover:text-ink">Support</a>
            <div className="h-4 w-px bg-ink/10" />
            <a 
              href="/admin/login" 
              className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-5 py-2 text-sm font-bold text-ink shadow-sm transition hover:bg-black hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Admin OS
            </a>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-ink/20">
          © 2026 LYXAA DIGITAL INSTRUMENTS. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}


