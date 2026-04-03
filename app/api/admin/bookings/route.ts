import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase-server';

// BookingSubmission type — used by admin UI (camelCase)
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

function isAuthorized(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

// Map Supabase row → BookingSubmission, joining doctor/service names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSubmission(row: any, doctors: any[], services: any[]): BookingSubmission {
  const doctor = doctors.find((d) => d.id === row.doctor_id);
  const service = services.find((s) => s.id === row.service_id);

  return {
    id: row.id,
    createdAt: row.created_at,
    doctorId: row.doctor_id ?? '',
    doctorName: doctor?.name ?? '',
    doctorSpecialty: doctor?.specialty ?? '',
    serviceId: row.service_id ?? '',
    serviceName: service?.name ?? '',
    serviceDuration: service?.duration ?? '',
    patientName: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    age: row.age ?? '',
    notes: row.notes ?? '',
    deliveryMode: 'mailto',
    status: 'submitted'
  };
}

// GET /api/admin/bookings — list all
export async function GET() {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();

  // Fetch bookings + doctors + services to join names
  const [bookingsRes, doctorsRes, servicesRes] = await Promise.all([
    db.from('bookings').select('*').order('created_at', { ascending: false }),
    db.from('doctors').select('id, name, specialty'),
    db.from('services').select('id, name, duration')
  ]);

  if (bookingsRes.error) {
    return NextResponse.json({ error: bookingsRes.error.message }, { status: 500 });
  }

  const doctors = doctorsRes.data ?? [];
  const services = servicesRes.data ?? [];
  const submissions = (bookingsRes.data ?? []).map((row) => rowToSubmission(row, doctors, services));

  return NextResponse.json({ submissions });
}

// POST /api/admin/bookings — manual add
export async function POST(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let submission: BookingSubmission;
  try {
    const body = await request.json();
    submission = body.submission;
    if (!submission?.patientName) throw new Error('Invalid payload');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db.from('bookings').insert({
    name: submission.patientName,
    phone: submission.phone,
    email: submission.email,
    age: submission.age,
    notes: submission.notes,
    doctor_id: submission.doctorId,
    service_id: submission.serviceId
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PUT /api/admin/bookings — update one
export async function PUT(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let submission: BookingSubmission;
  try {
    const body = await request.json();
    submission = body.submission;
    if (!submission?.id) throw new Error('Missing id');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db
    .from('bookings')
    .update({
      name: submission.patientName,
      phone: submission.phone,
      email: submission.email,
      age: submission.age,
      notes: submission.notes,
      doctor_id: submission.doctorId,
      service_id: submission.serviceId
    })
    .eq('id', submission.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/bookings?id=... — remove one
export async function DELETE(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db.from('bookings').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
