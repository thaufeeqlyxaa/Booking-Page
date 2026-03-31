import { doctors as defaultDoctors, type Doctor } from '@/data/doctors';
import { services as defaultServices, type Service } from '@/data/services';

const DOCTORS_STORAGE_KEY = 'lyxaa.v2.catalog.doctors';
const SERVICES_STORAGE_KEY = 'lyxaa.v2.catalog.services';
const SUBMISSIONS_STORAGE_KEY = 'lyxaa.v2.catalog.submissions';

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
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    console.error('Storage parse error:', e);
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

  if (!record.name || !record.specialty || !record.experience || !record.bio || !record.hours || !record.languages) {
    return null;
  }

  return {
    id: typeof record.id === 'string' && record.id.trim() ? record.id : `doctor-${index + 1}`,
    name: record.name.trim(),
    specialty: record.specialty.trim(),
    experience: record.experience.trim(),
    bio: record.bio.trim(),
    image: typeof record.image === 'string' && record.image.trim() ? record.image.trim() : '/images/doctors/doctor-1.svg',
    hours: record.hours.trim(),
    topics,
    languages: record.languages.trim(),
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

  if (!record.createdAt || !record.doctorName || !record.patientName || !record.phone || !record.email || !record.age) {
    return null;
  }

  return {
    id: typeof record.id === 'string' && record.id.trim() ? record.id : `submission-${index + 1}`,
    createdAt: record.createdAt,
    doctorId: typeof record.doctorId === 'string' ? record.doctorId : '',
    doctorName: record.doctorName.trim(),
    doctorSpecialty: typeof record.doctorSpecialty === 'string' ? record.doctorSpecialty.trim() : '',
    serviceId: typeof record.serviceId === 'string' ? record.serviceId : '',
    serviceName: typeof record.serviceName === 'string' ? record.serviceName.trim() : '',
    serviceDuration: typeof record.serviceDuration === 'string' ? record.serviceDuration.trim() : '',
    patientName: record.patientName.trim(),
    phone: record.phone.trim(),
    email: record.email.trim(),
    age: record.age.trim(),
    notes: typeof record.notes === 'string' && record.notes.trim() ? record.notes.trim() : 'None provided',
    deliveryMode,
    status: 'submitted'
  };
}

// Helper to ensure storage is seeded if empty
function initializeStorageFallback<T>(key: string, defaults: T[]): T[] {
  if (!hasStorage()) return defaults;
  const existing = window.localStorage.getItem(key);
  if (!existing) {
    window.localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  const parsed = safeParse<T[]>(existing);
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaults;
}

export function getStoredDoctors(): Doctor[] {
  const data = initializeStorageFallback(DOCTORS_STORAGE_KEY, defaultDoctors);
  return data
    .map((item, index) => normalizeDoctor(item, index))
    .filter((item): item is Doctor => Boolean(item));
}

export function saveStoredDoctors(nextDoctors: Doctor[]) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(nextDoctors));
  } catch (e) {
    console.error('Failed to save doctors:', e);
  }
}

export function getStoredServices(): Service[] {
  const data = initializeStorageFallback(SERVICES_STORAGE_KEY, defaultServices);
  return data
    .map((item, index) => normalizeService(item, index))
    .filter((item): item is Service => Boolean(item));
}

export function saveStoredServices(nextServices: Service[]) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(nextServices));
  } catch (e) {
    console.error('Failed to save services:', e);
  }
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
  try {
    window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(nextSubmissions));
  } catch (e) {
    console.error('Failed to save submissions:', e);
  }
}

export function appendStoredBookingSubmission(submission: BookingSubmission) {
  const nextSubmissions = [submission, ...getStoredBookingSubmissions()];
  saveStoredBookingSubmissions(nextSubmissions);
  return nextSubmissions;
}

export function updateStoredBookingSubmission(updated: BookingSubmission) {
  const nextSubmissions = getStoredBookingSubmissions().map((item) => (item.id === updated.id ? updated : item));
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
