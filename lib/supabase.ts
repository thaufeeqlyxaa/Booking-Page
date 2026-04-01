import { createClient } from '@supabase/supabase-js';
import { type Doctor } from '@/data/doctors';
import { type Service } from '@/data/services';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Booking row (snake_case matches the SQL schema) ────────────────────────

export type BookingRow = {
  id: string;
  created_at: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  service_id: string;
  service_name: string;
  service_duration: string;
  patient_name: string;
  phone: string;
  email: string;
  age: string;
  notes: string;
  delivery_mode: 'emailjs' | 'formsubmit' | 'mailto';
  status: 'submitted';
};

// ─── Public fetch helpers (use anon key + RLS) ───────────────────────────────

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, name, specialty, experience, bio, image, hours, topics, languages, price')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[supabase] fetchDoctors error:', error.message);
    return [];
  }

  return (data ?? []) as Doctor[];
}

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, duration, focus, price')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[supabase] fetchServices error:', error.message);
    return [];
  }

  return (data ?? []) as Service[];
}

export async function insertBooking(row: BookingRow): Promise<{ error: string | null }> {
  const { error } = await supabase.from('bookings').insert(row);
  if (error) {
    console.error('[supabase] insertBooking error:', error.message);
    return { error: error.message };
  }
  return { error: null };
}
