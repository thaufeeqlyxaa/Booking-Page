import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase-server';
import { type Service } from '@/lib/supabase';

function isAuthorized(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

// GET /api/admin/services — list all
export async function GET() {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const services: Service[] = (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    duration: row.duration ?? '',
    focus: row.focus ?? '',
    price: row.price ?? 1000
  }));

  return NextResponse.json({ services });
}

// POST /api/admin/services — create or update
export async function POST(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let service: Service;
  try {
    const body = await request.json();
    service = body.service;
    if (!service?.name) throw new Error('Invalid payload');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { id } = service;
  const dbRow: Record<string, unknown> = {
    name: service.name,
    description: service.description,
    duration: service.duration,
    price: service.price,
    focus: service.focus
  };

  const db = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function upsertService(row: Record<string, unknown>): Promise<{ data: any; error: any }> {
    if (id) {
      return db.from('services').update(row).eq('id', id).select().single();
    }
    return db.from('services').insert(row).select().single();
  }

  let { data, error } = await upsertService(dbRow);

  // If focus column doesn't exist yet, retry without it
  if (error?.message?.includes('column')) {
    const { focus: _f, ...baseRow } = dbRow;
    ({ data, error } = await upsertService(baseRow));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return NextResponse.json({
    service: {
      id: row.id,
      name: row.name ?? '',
      description: row.description ?? '',
      duration: row.duration ?? '',
      focus: row.focus ?? service.focus ?? '',
      price: row.price ?? 1000
    }
  });
}

// DELETE /api/admin/services?id=... — remove one
export async function DELETE(request: NextRequest) {
  if (!isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const db = createServerClient();
  const { error } = await db.from('services').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
