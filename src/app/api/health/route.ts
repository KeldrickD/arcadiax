import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  let scheduler: { lastTickTs: number | null; minutesSince: number | null } = { lastTickTs: null, minutesSince: null };
  if (url && serviceKey) {
    try {
      const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
      const { data } = await supabase.from('system_kv').select('value').eq('key', 'scheduler:last_tick').maybeSingle();
      const last = Number((data as any)?.value?.ts ?? 0) || null;
      scheduler.lastTickTs = last;
      scheduler.minutesSince = last ? Math.floor((Date.now() - last) / 60000) : null;
    } catch {}
  }
  return NextResponse.json({ ok: true, ts: Date.now(), scheduler });
}


