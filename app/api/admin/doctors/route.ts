import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase-server';
import { type Doctor } from '@/data/doctors';

function isAuthorized(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

// GET /api/admin/doctors — list all
export async function GET() {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('doctors')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map image_url → image for the frontend Doctor type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctors = (data ?? []).map((row: any) => ({ ...row, image: row.image_url ?? row.image ?? '/images/doctors/doctor-1.svg' }));
  return NextResponse.json({ doctors });
}

// POST /api/admin/doctors — upsert (create or update)
export async function POST(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let doctor: Doctor;
  try {
    const body = await request.json();
    doctor = body.doctor;
    if (!doctor?.id || !doctor?.name) throw new Error('Invalid payload');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Map Doctor type → Supabase row (image → image_url)
  const { image, ...rest } = doctor;
  const dbRow = { ...rest, image_url: image };

  const db = createServerClient();
  const { data, error } = await db
    .from('doctors')
    .upsert(dbRow, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map back: image_url → image
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return NextResponse.json({ doctor: { ...row, image: row.image_url } });
}

// DELETE /api/admin/doctors?id=... — remove one
export async function DELETE(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db.from('doctors').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
