import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// GET /api/catalog — public endpoint for booking page
// Uses service_role to bypass RLS, returns doctors + services
export async function GET() {
  const db = createServerClient();

  const [doctorsRes, servicesRes] = await Promise.all([
    db.from('doctors').select('*').order('created_at', { ascending: true }),
    db.from('services').select('*').order('created_at', { ascending: true })
  ]);

  if (doctorsRes.error) {
    return NextResponse.json({ error: doctorsRes.error.message }, { status: 500 });
  }

  if (servicesRes.error) {
    return NextResponse.json({ error: servicesRes.error.message }, { status: 500 });
  }

  // Map DB rows → frontend types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctors = (doctorsRes.data ?? []).map((row: any) => ({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const services = (servicesRes.data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    duration: row.duration ?? '',
    focus: row.focus ?? '',
    price: row.price ?? 1000
  }));

  return NextResponse.json({ doctors, services });
}
