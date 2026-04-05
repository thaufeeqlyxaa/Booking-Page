import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function GET() {
  console.log('Starting data cleanup...');
  const results = { doctorsDeleted: 0, servicesDeleted: 0, errors: [] as string[] };

  try {
    // 1. Clean Doctors
    const { data: doctors, error: docError } = await supabase.from('doctors').select('*');
    if (docError) throw docError;

    const docMap = new Map<string, any>();
    const docIdsToDelete: string[] = [];

    for (const doc of doctors || []) {
      const name = doc.name.trim().toLowerCase();
      if (docMap.has(name)) {
        docIdsToDelete.push(doc.id);
      } else {
        docMap.set(name, doc);
      }
    }

    if (docIdsToDelete.length > 0) {
      const { error: delError } = await supabase.from('doctors').delete().in('id', docIdsToDelete);
      if (delError) throw delError;
      results.doctorsDeleted = docIdsToDelete.length;
    }

    // 2. Clean Services
    const { data: services, error: srvError } = await supabase.from('services').select('*');
    if (srvError) throw srvError;

    const srvMap = new Map<string, any>();
    const srvIdsToDelete: string[] = [];

    for (const srv of services || []) {
      const name = srv.name.trim().toLowerCase();
      if (srvMap.has(name)) {
        srvIdsToDelete.push(srv.id);
      } else {
        srvMap.set(name, srv);
      }
    }

    if (srvIdsToDelete.length > 0) {
      const { error: delError } = await supabase.from('services').delete().in('id', srvIdsToDelete);
      if (delError) throw delError;
      results.servicesDeleted = srvIdsToDelete.length;
    }

    return NextResponse.json({ success: true, message: 'Cleanup complete', results });

  } catch (error: any) {
    results.errors.push(error.message);
    return NextResponse.json({ success: false, results, error: error.message }, { status: 500 });
  }
}
