import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase-server';
import { type Doctor } from '@/lib/supabase';

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

  // Map DB rows → Doctor type (image_url → image)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctors: Doctor[] = (data ?? []).map((row: any) => ({
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

  return NextResponse.json({ doctors });
}

// POST /api/admin/doctors — create or update
export async function POST(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let doctor: Doctor;
  try {
    const body = await request.json();
    doctor = body.doctor;
    if (!doctor?.name) throw new Error('Invalid payload');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Map Doctor type → DB row (image → image_url, omit id for new records)
  const { image, id } = doctor;
  const dbRow: Record<string, unknown> = {
    name: doctor.name,
    specialty: doctor.specialty,
    experience: doctor.experience,
    bio: doctor.bio,
    image_url: image,
    price: doctor.price,
    // Extended columns — may not exist before migration
    hours: doctor.hours,
    topics: doctor.topics,
    languages: doctor.languages
  };

  const db = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function upsertDoctor(row: Record<string, unknown>): Promise<{ data: any; error: any }> {
    if (id) {
      return db.from('doctors').update(row).eq('id', id).select().single();
    }
    return db.from('doctors').insert(row).select().single();
  }

  let { data, error } = await upsertDoctor(dbRow);

  // If extended columns don't exist yet, retry without them
  if (error?.message?.includes('column')) {
    const { hours: _h, topics: _t, languages: _l, ...baseRow } = dbRow;
    ({ data, error } = await upsertDoctor(baseRow));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return NextResponse.json({
    doctor: {
      id: row.id,
      name: row.name ?? '',
      specialty: row.specialty ?? '',
      experience: row.experience ?? '',
      bio: row.bio ?? '',
      image: row.image_url ?? '/images/doctors/doctor-1.svg',
      hours: row.hours ?? doctor.hours ?? '',
      topics: Array.isArray(row.topics) ? row.topics : doctor.topics ?? [],
      languages: row.languages ?? doctor.languages ?? 'English',
      price: row.price ?? 1000
    }
  });
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
