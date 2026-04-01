import { createClient } from '@supabase/supabase-js';
import { type Doctor } from '@/data/doctors';
import { type Service } from '@/data/services';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton — prevents multiple GoTrueClient instances in dev HMR
const globalForSupabase = globalThis as typeof globalThis & { _supabase?: ReturnType<typeof createClient> };
export const supabase = globalForSupabase._supabase ?? createClient(supabaseUrl, supabaseAnonKey);
if (process.env.NODE_ENV !== 'production') globalForSupabase._supabase = supabase;

// ─── Booking row — matches actual Supabase schema ───────────────────────────
// NOTE: bookings.name = patient name (existing column)
// Extended columns (patient_name, doctor_name, etc.) added via ALTER TABLE

export type BookingRow = {
  id: string;
  created_at: string;
  // original schema columns
  name: string;           // patient name — original column
  phone: string;
  email: string;
  age: string;
  notes: string;
  doctor_id: string;
  service_id: string;
  // extended columns (added via ALTER TABLE)
  patient_name?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  service_name?: string;
  service_duration?: string;
  delivery_mode?: 'emailjs' | 'formsubmit' | 'mailto';
  status?: 'submitted';
};

// ─── Public fetch helpers (anon key + RLS) ──────────────────────────────────

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[supabase] fetchDoctors error:', error.message);
    return [];
  }

  // Map Supabase row → Doctor type, handling column name differences
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): Doctor => ({
    id: row.id,
    name: row.name,
    specialty: row.specialty ?? '',
    experience: row.experience ?? '',
    bio: row.bio ?? '',
    image: row.image_url ?? row.image ?? '/images/doctors/doctor-1.svg',
    hours: row.hours ?? '0+ therapy hours',
    topics: Array.isArray(row.topics) ? row.topics : [],
    languages: row.languages ?? 'English',
    price: row.price ?? 1000
  }));
}

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[supabase] fetchServices error:', error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): Service => ({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    duration: row.duration ?? '',
    focus: row.focus ?? '',
    price: row.price ?? 1000
  }));
}

export async function insertBooking(row: BookingRow): Promise<{ error: string | null }> {
  const { error } = await supabase.from('bookings').insert(row);
  if (error) {
    console.error('[supabase] insertBooking error:', error.message);
    return { error: error.message };
  }
  return { error: null };
}
