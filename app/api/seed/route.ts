import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Seed data — matches exactly what the UI expects
const SEED_DOCTORS = [
  {
    name: 'Dr. Andrea Cole',
    specialty: 'Consultant Psychologist',
    experience: '12 yrs experience',
    bio: 'Calm, structured sessions for emotional resilience, transitions, and relationship clarity.',
    image_url: '/images/doctors/doctor-1.svg',
    price: 1500
  },
  {
    name: 'Dr. Simon Lee',
    specialty: 'Consultant Psychologist',
    experience: '10 yrs experience',
    bio: 'Focused on anxiety recovery, emotional regulation, and confidence-building sessions.',
    image_url: '/images/doctors/doctor-2.svg',
    price: 1200
  },
  {
    name: 'Dr. Maya Pratt',
    specialty: 'Consultant Psychologist',
    experience: '8 yrs experience',
    bio: 'Blends supportive talk therapy with practical strategies for everyday mental wellness.',
    image_url: '/images/doctors/doctor-3.svg',
    price: 1000
  },
  {
    name: 'Dr. Sameeha Salim',
    specialty: 'Consultant Psychologist',
    experience: '9 yrs experience',
    bio: 'Works gently with self-esteem, emotional conflicts, and life direction challenges.',
    image_url: '/images/doctors/doctor-2.svg',
    price: 1000
  },
  {
    name: 'Dr. Angeline Akkara',
    specialty: 'Consultant Psychologist',
    experience: '11 yrs experience',
    bio: 'A grounded therapist for adjustment issues, work stress, and emotional overwhelm.',
    image_url: '/images/doctors/doctor-1.svg',
    price: 1000
  },
  {
    name: 'Dr. Archana Iyer',
    specialty: 'Consultant Psychologist',
    experience: '7 yrs experience',
    bio: 'Supports clients with structured care around learning challenges, stress, and focus.',
    image_url: '/images/doctors/doctor-3.svg',
    price: 1000
  }
];

// Extended fields — added after migration
const DOCTOR_EXTRAS: Record<string, { hours: string; topics: string[]; languages: string }> = {
  'Dr. Andrea Cole': { hours: '5000+ therapy hours', topics: ['Life transitions', 'Stress', 'Relationship concerns'], languages: 'English, Malayalam' },
  'Dr. Simon Lee': { hours: '2500+ therapy hours', topics: ['Anxiety', 'Burnout', 'Anger management'], languages: 'English, Hindi' },
  'Dr. Maya Pratt': { hours: '2500+ therapy hours', topics: ['Trauma', 'Motivation', 'Self-esteem'], languages: 'English, Tamil' },
  'Dr. Sameeha Salim': { hours: '3000+ therapy hours', topics: ['Self-esteem', 'Emotional conflicts', 'Life direction'], languages: 'English, Malayalam' },
  'Dr. Angeline Akkara': { hours: '1500+ therapy hours', topics: ['Adjustment', 'Work stress', 'Emotional regulation'], languages: 'English, Malayalam' },
  'Dr. Archana Iyer': { hours: '2500+ therapy hours', topics: ['Stress', 'Focus', 'Neurodivergent support'], languages: 'English, Hindi, Tamil' }
};

const SEED_SERVICES = [
  { name: 'Holistic Wellness', description: 'Root-cause review with wellness plans tuned to your rhythms.', duration: '30 min', price: 1200 },
  { name: 'Movement & Recovery', description: 'Movement analysis, musculoskeletal cadence, and recovery cues.', duration: '40 min', price: 1400 },
  { name: 'Mindful Clarity', description: 'Calm, high-trust space to explore stress, resilient habits, and clarity.', duration: '35 min', price: 1000 }
];

const SERVICE_FOCUS: Record<string, string> = {
  'Holistic Wellness': 'Lifestyle + Nutrition',
  'Movement & Recovery': 'Mobility + Recovery',
  'Mindful Clarity': 'Stress + Resilience'
};

// POST /api/seed — idempotent seed (clears + re-inserts)
export async function POST() {
  const db = createServerClient();

  // Clear existing data
  await db.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('doctors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Try inserting doctors with extended columns first
  const doctorsWithExtras = SEED_DOCTORS.map((d) => ({
    ...d,
    ...DOCTOR_EXTRAS[d.name]
  }));

  let { data: doctorData, error: doctorError } = await db
    .from('doctors')
    .insert(doctorsWithExtras)
    .select();

  // If extended columns don't exist yet, fall back to base columns only
  if (doctorError?.message?.includes('column')) {
    const result = await db.from('doctors').insert(SEED_DOCTORS).select();
    doctorData = result.data;
    doctorError = result.error;
  }

  if (doctorError) {
    return NextResponse.json({ error: `Doctor seed failed: ${doctorError.message}` }, { status: 500 });
  }

  // Try inserting services with focus column
  const servicesWithFocus = SEED_SERVICES.map((s) => ({
    ...s,
    focus: SERVICE_FOCUS[s.name] ?? ''
  }));

  let { data: serviceData, error: serviceError } = await db
    .from('services')
    .insert(servicesWithFocus)
    .select();

  // If focus column doesn't exist yet, fall back to base columns only
  if (serviceError?.message?.includes('column')) {
    const result = await db.from('services').insert(SEED_SERVICES).select();
    serviceData = result.data;
    serviceError = result.error;
  }

  if (serviceError) {
    return NextResponse.json({ error: `Service seed failed: ${serviceError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    doctors: doctorData?.length ?? 0,
    services: serviceData?.length ?? 0,
    note: 'Run supabase/migration.sql to add hours, topics, languages, and focus columns for full data.'
  });
}
