/**
 * lib/supabase-api.ts
 * Central API layer for all Supabase database operations.
 * This replaces catalog-storage.ts (localStorage) entirely.
 */

import { supabase } from '@/utils/supabase/client';
import { Doctor, Service, Booking } from '@/types';

// ─────────────────────────────────────────────
// TYPE DEFINITIONS (matching Supabase schema)
// ─────────────────────────────────────────────

export type DbDoctor = {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  bio: string;
  image_url: string;
  price: number;
  created_at?: string;
  // Local-only fields used by frontend (not in DB)
  hours?: string;
  topics?: string[];
  languages?: string;
  slot?: string;
};

export type DbService = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  created_at?: string;
};

export type DbBooking = {
  id?: string;
  doctor_id: string;
  service_id: string;
  name: string;
  phone: string;
  email: string;
  age: string;
  notes: string;
  created_at?: string;
};

// ─────────────────────────────────────────────
// DOCTORS
// ─────────────────────────────────────────────

export async function fetchDoctors(): Promise<DbDoctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Supabase fetchDoctors error:', error.message);
    return [];
  }

  console.log('✅ Supabase doctors:', data?.length, 'records');
  return (data ?? []).map(normalizeDoctor);
}

export async function insertDoctor(doctor: Omit<DbDoctor, 'id' | 'created_at'>): Promise<DbDoctor | null> {
  // 1. Check for duplicates by name
  const { data: existing } = await supabase
    .from('doctors')
    .select('id')
    .ilike('name', doctor.name.trim())
    .limit(1);

  if (existing && existing.length > 0) {
    console.error('❌ Insert failed: Doctor with this name already exists.');
    return null;
  }

  // 2. Insert new record
  const { data, error } = await supabase
    .from('doctors')
    .insert([{ ...doctor }])
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase insertDoctor error:', error.message);
    return null;
  }
  return normalizeDoctor(data);
}

export async function updateDoctor(id: string, updates: Partial<DbDoctor>): Promise<boolean> {
  const { error } = await supabase.from('doctors').update(updates).eq('id', id);
  if (error) {
    console.error('❌ Supabase updateDoctor error:', error.message);
    return false;
  }
  return true;
}

export async function deleteDoctor(id: string): Promise<boolean> {
  const { error } = await supabase.from('doctors').delete().eq('id', id);
  if (error) {
    console.error('❌ Supabase deleteDoctor error:', error.message);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────

export async function fetchServices(): Promise<DbService[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Supabase fetchServices error:', error.message);
    return [];
  }

  console.log('✅ Supabase services:', data?.length, 'records');
  return data ?? [];
}

export async function insertService(service: Omit<DbService, 'id' | 'created_at'>): Promise<DbService | null> {
  // 1. Check for duplicates by name
  const { data: existing } = await supabase
    .from('services')
    .select('id')
    .ilike('name', service.name.trim())
    .limit(1);

  if (existing && existing.length > 0) {
    console.error('❌ Insert failed: Service with this name already exists.');
    return null;
  }

  // 2. Insert new record
  const { data, error } = await supabase
    .from('services')
    .insert([{ ...service }])
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase insertService error:', error.message);
    return null;
  }
  return data;
}

export async function updateService(id: string, updates: Partial<DbService>): Promise<boolean> {
  const { error } = await supabase.from('services').update(updates).eq('id', id);
  if (error) {
    console.error('❌ Supabase updateService error:', error.message);
    return false;
  }
  return true;
}

export async function deleteService(id: string): Promise<boolean> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) {
    console.error('❌ Supabase deleteService error:', error.message);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────

export async function insertBooking(booking: DbBooking): Promise<string | null> {
  const { data, error } = await supabase
    .from('bookings')
    .insert([booking])
    .select('id')
    .single();

  if (error) {
    console.error('❌ Supabase insertBooking error:', error.message);
    return null;
  }
  console.log('✅ Booking saved to Supabase:', data?.id);
  return data?.id ?? null;
}

export async function updateBooking(id: string, updates: Partial<DbBooking>): Promise<boolean> {
  const { error } = await supabase.from('bookings').update(updates).eq('id', id);
  if (error) {
    console.error('❌ Supabase updateBooking error:', error.message);
    return false;
  }
  return true;
}

export async function deleteBooking(id: string): Promise<boolean> {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) {
    console.error('❌ Supabase deleteBooking error:', error.message);
    return false;
  }
  return true;
}

export async function fetchBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Bookings fetch error:", error);
    return [];
  }

  console.log("Bookings from Supabase:", data);

  return data;
}

// ─────────────────────────────────────────────
// SEED (STEP 4 + 5)
// ─────────────────────────────────────────────

export async function seedDatabase() {
  console.log('🌱 Seed database already performed or logic removed to clean up static files.');
}

// ─────────────────────────────────────────────
// STORAGE (IMAGES)
// ─────────────────────────────────────────────

/**
 * Uploads a file to the 'doctors' Supabase bucket and returns the public URL.
 * Throws an error if the upload fails.
 */
export async function uploadDoctorImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('doctors')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('❌ Supabase storage upload error:', uploadError.message);
    throw new Error('Failed to upload image. Please try again.');
  }

  const { data: publicUrlData } = supabase.storage
    .from('doctors')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
// ─────────────────────────────────────────────

function normalizeDoctor(raw: Record<string, unknown>): DbDoctor {
  return {
    id: raw.id as string,
    name: raw.name as string,
    specialty: raw.specialty as string,
    experience: raw.experience as string,
    bio: raw.bio as string,
    image_url: (raw.image_url ?? raw.image ?? '') as string,
    price: raw.price as number,
    created_at: raw.created_at as string | undefined,
    // Provide safe defaults for frontend-only fields
    hours: (raw.hours as string) ?? '',
    topics: (raw.topics as string[]) ?? [],
    languages: (raw.languages as string) ?? '',
    slot: (raw.slot as string) ?? 'Available',
  };
}
