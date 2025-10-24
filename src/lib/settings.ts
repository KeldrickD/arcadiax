import { createClient } from '@supabase/supabase-js';

export type AccountSettings = {
  allowRaffles?: boolean;
  allowPredictions?: boolean;
  quietStartHour?: number;
  quietEndHour?: number;
  pushDailyCap?: number;
  feedDailyCap?: number;
};

const ENV_DEFAULTS: Required<AccountSettings> = {
  allowRaffles: (process.env.ALLOW_RAFFLES ?? 'true') === 'true',
  allowPredictions: (process.env.ALLOW_PREDICTIONS ?? 'true') === 'true',
  quietStartHour: Number(process.env.QUIET_START_HOUR ?? 22),
  quietEndHour: Number(process.env.QUIET_END_HOUR ?? 8),
  pushDailyCap: Number(process.env.PUSH_DAILY_CAP ?? 3),
  feedDailyCap: Number(process.env.FEED_DAILY_CAP ?? 5),
};

export async function getAccountSettings(accountId: string): Promise<Required<AccountSettings>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return ENV_DEFAULTS;
  try {
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data } = await supabase.from('account_settings').select('*').eq('account_id', accountId).maybeSingle();
    if (!data) return ENV_DEFAULTS;
    return {
      allowRaffles: data.allow_raffles ?? ENV_DEFAULTS.allowRaffles,
      allowPredictions: data.allow_predictions ?? ENV_DEFAULTS.allowPredictions,
      quietStartHour: (data.quiet_start_hour ?? ENV_DEFAULTS.quietStartHour) as number,
      quietEndHour: (data.quiet_end_hour ?? ENV_DEFAULTS.quietEndHour) as number,
      pushDailyCap: (data.push_daily_cap ?? ENV_DEFAULTS.pushDailyCap) as number,
      feedDailyCap: (data.feed_daily_cap ?? ENV_DEFAULTS.feedDailyCap) as number,
    };
  } catch {
    return ENV_DEFAULTS;
  }
}

export async function upsertAccountSettings(accountId: string, partial: AccountSettings): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) throw new Error('Missing Supabase');
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  await supabase.from('account_settings').upsert({
    account_id: accountId,
    allow_raffles: partial.allowRaffles,
    allow_predictions: partial.allowPredictions,
    quiet_start_hour: partial.quietStartHour,
    quiet_end_hour: partial.quietEndHour,
    push_daily_cap: partial.pushDailyCap,
    feed_daily_cap: partial.feedDailyCap,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'account_id' });
}


