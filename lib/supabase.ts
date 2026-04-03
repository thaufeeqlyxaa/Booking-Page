import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton — prevents multiple GoTrueClient instances in dev HMR
const globalForSupabase = globalThis as typeof globalThis & { _supabase?: ReturnType<typeof createClient> };
export const supabase = globalForSupabase._supabase ?? createClient(supabaseUrl, supabaseAnonKey);
if (process.env.NODE_ENV !== 'production') globalForSupabase._supabase = supabase;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  bio: string;
  image: string;       // mapped from image_url in DB
  hours: string;
  topics: string[];
  languages: string;
  price: number;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  focus: string;
  price: number;
};

export type BookingRow = {
  name: string;
  phone: string;
  email: string;
  age: string;
  notes: string;
  doctor_id: string;
  service_id: string;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): Doctor => ({
    id: row.id,
    name: row.name ?? '',
    specialty: row.specialty ?? '',
    experience: row.experience ?? '',
    bio: row.bio ?? '',
    image: row.image_url ?? '/images/doctors/doctor-1.svg',
    hours: row.hours ?? '',
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
    name: row.name ?? '',
    description: row.description ?? '',
    duration: row.duration ?? '',
    focus: row.focus ?? '',
    price: row.price ?? 1000
  }));
}

export async function insertBooking(row: BookingRow): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('bookings').insert(row as any);
  if (error) {
    console.error('[supabase] insertBooking error:', error.message);
    return { error: error.message };
  }
  return { error: null };
}
