import { doctors as defaultDoctors, type Doctor } from '@/data/doctors';
import { services as defaultServices, type Service } from '@/data/services';

const DOCTORS_STORAGE_KEY = 'lyxaa.catalog.doctors';
const SERVICES_STORAGE_KEY = 'lyxaa.catalog.services';
const SUBMISSIONS_STORAGE_KEY = 'lyxaa.catalog.submissions';

export type BookingSubmission = {
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

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeDoctor(value: unknown, index: number): Doctor | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Partial<Doctor>;
  const price = typeof record.price === 'number' ? record.price : Number(record.price ?? 0);
  const topics = Array.isArray(record.topics)
    ? record.topics.filter((topic): topic is string => typeof topic === 'string' && topic.trim().length > 0)
    : [];

  if (!record.name || !record.specialty || !record.experience || !record.bio || !record.hours || !record.slot) {
    return null;
  }

  return {
    id: typeof record.id === 'string' && record.id.trim() ? record.id : `doctor-${index + 1}`,
    name: record.name.trim(),
    specialty: record.specialty.trim(),
    experience: record.experience.trim(),
    bio: record.bio.trim(),
    image:
      typeof record.image === 'string' && record.image.trim()
        ? record.image.trim()
        : '/images/doctors/doctor-1.svg',
    hours: record.hours.trim(),
    topics,
    slot: record.slot.trim(),
    price: Number.isFinite(price) && price > 0 ? price : 1000
  };
}

function normalizeService(value: unknown, index: number): Service | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Partial<Service>;
  const price = typeof record.price === 'number' ? record.price : Number(record.price ?? 0);

  if (!record.name || !record.description || !record.duration || !record.focus) {
    return null;
  }

  return {
    id: typeof record.id === 'string' && record.id.trim() ? record.id : `service-${index + 1}`,
    name: record.name.trim(),
    description: record.description.trim(),
    duration: record.duration.trim(),
    focus: record.focus.trim(),
    price: Number.isFinite(price) && price > 0 ? price : 1000
  };
}

function normalizeBookingSubmission(value: unknown, index: number): BookingSubmission | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Partial<BookingSubmission>;
  const deliveryMode =
    record.deliveryMode === 'emailjs' || record.deliveryMode === 'formsubmit' || record.deliveryMode === 'mailto'
      ? record.deliveryMode
      : 'mailto';

  if (
    !record.createdAt ||
    !record.doctorName ||
    !record.doctorSpecialty ||
    !record.serviceName ||
    !record.serviceDuration ||
    !record.patientName ||
    !record.phone ||
    !record.email ||
    !record.age
  ) {
    return null;
  }

  return {
    id: typeof record.id === 'string' && record.id.trim() ? record.id : `submission-${index + 1}`,
    createdAt: record.createdAt,
    doctorId: typeof record.doctorId === 'string' ? record.doctorId : '',
    doctorName: record.doctorName.trim(),
    doctorSpecialty: record.doctorSpecialty.trim(),
    serviceId: typeof record.serviceId === 'string' ? record.serviceId : '',
    serviceName: record.serviceName.trim(),
    serviceDuration: record.serviceDuration.trim(),
    patientName: record.patientName.trim(),
    phone: record.phone.trim(),
    email: record.email.trim(),
    age: record.age.trim(),
    notes: typeof record.notes === 'string' && record.notes.trim() ? record.notes.trim() : 'None provided',
    deliveryMode,
    status: 'submitted'
  };
}

export function getStoredDoctors(): Doctor[] {
  if (!hasStorage()) return defaultDoctors;

  const parsed = safeParse<unknown[]>(window.localStorage.getItem(DOCTORS_STORAGE_KEY));
  if (!Array.isArray(parsed)) return defaultDoctors;

  const normalized = parsed
    .map((item, index) => normalizeDoctor(item, index))
    .filter((item): item is Doctor => Boolean(item));

  return normalized;
}

export function saveStoredDoctors(nextDoctors: Doctor[]) {
  if (!hasStorage()) return;
  window.localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(nextDoctors));
}

export function getStoredServices(): Service[] {
  if (!hasStorage()) return defaultServices;

  const parsed = safeParse<unknown[]>(window.localStorage.getItem(SERVICES_STORAGE_KEY));
  if (!Array.isArray(parsed)) return defaultServices;

  const normalized = parsed
    .map((item, index) => normalizeService(item, index))
    .filter((item): item is Service => Boolean(item));

  return normalized;
}

export function saveStoredServices(nextServices: Service[]) {
  if (!hasStorage()) return;
  window.localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(nextServices));
}

export function getStoredBookingSubmissions(): BookingSubmission[] {
  if (!hasStorage()) return [];

  const parsed = safeParse<unknown[]>(window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item, index) => normalizeBookingSubmission(item, index))
    .filter((item): item is BookingSubmission => Boolean(item))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function saveStoredBookingSubmissions(nextSubmissions: BookingSubmission[]) {
  if (!hasStorage()) return;
  window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(nextSubmissions));
}

export function appendStoredBookingSubmission(submission: BookingSubmission) {
  const nextSubmissions = [submission, ...getStoredBookingSubmissions()];
  saveStoredBookingSubmissions(nextSubmissions);
  return nextSubmissions;
}

export function removeStoredBookingSubmission(submissionId: string) {
  const nextSubmissions = getStoredBookingSubmissions().filter((item) => item.id !== submissionId);
  saveStoredBookingSubmissions(nextSubmissions);
  return nextSubmissions;
}

export function getCatalogCounts() {
  return {
    doctors: getStoredDoctors().length,
    services: getStoredServices().length,
    submissions: getStoredBookingSubmissions().length
  };
}
