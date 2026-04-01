import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase-server';
import { type BookingSubmission } from '@/lib/catalog-storage';
import { type BookingRow } from '@/lib/supabase';

function isAuthorized(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

// Map Supabase snake_case row → TypeScript camelCase BookingSubmission
function rowToSubmission(row: BookingRow): BookingSubmission {
  return {
    id: row.id,
    createdAt: row.created_at,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    doctorSpecialty: row.doctor_specialty,
    serviceId: row.service_id,
    serviceName: row.service_name,
    serviceDuration: row.service_duration,
    patientName: row.patient_name,
    phone: row.phone,
    email: row.email,
    age: row.age,
    notes: row.notes,
    deliveryMode: row.delivery_mode,
    status: 'submitted'
  };
}

// Map BookingSubmission → Supabase snake_case row
function submissionToRow(sub: BookingSubmission): BookingRow {
  return {
    id: sub.id,
    created_at: sub.createdAt,
    doctor_id: sub.doctorId,
    doctor_name: sub.doctorName,
    doctor_specialty: sub.doctorSpecialty,
    service_id: sub.serviceId,
    service_name: sub.serviceName,
    service_duration: sub.serviceDuration,
    patient_name: sub.patientName,
    phone: sub.phone,
    email: sub.email,
    age: sub.age,
    notes: sub.notes,
    delivery_mode: sub.deliveryMode,
    status: 'submitted'
  };
}

// GET /api/admin/bookings — list all (service_role bypasses RLS)
export async function GET() {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const submissions = (data ?? []).map((row) => rowToSubmission(row as BookingRow));
  return NextResponse.json({ submissions });
}

// POST /api/admin/bookings — manual add (upsert)
export async function POST(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let submission: BookingSubmission;
  try {
    const body = await request.json();
    submission = body.submission;
    if (!submission?.doctorName || !submission?.patientName) throw new Error('Invalid payload');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const row = submissionToRow(submission);
  const db = createServerClient();
  const { data, error } = await db
    .from('bookings')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submission: rowToSubmission(data as BookingRow) });
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

  const row = submissionToRow(submission);
  const db = createServerClient();
  const { data, error } = await db
    .from('bookings')
    .update(row)
    .eq('id', submission.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submission: rowToSubmission(data as BookingRow) });
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
