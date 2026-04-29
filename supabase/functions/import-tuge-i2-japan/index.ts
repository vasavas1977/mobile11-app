import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
const MARKUP = 4.0;

interface PkgDef {
  code: string;
  cost: number;
  days: number;
  type: 'day_pass' | 'limitless' | 'max_speed';
  dataAmt: string;      // e.g. '1GB/day', 'Unlimited', '10GB'
  dailyGb?: string;     // for day_pass: '1GB', '2GB', '3GB'
  totalGb?: string;     // for max_speed: '1GB', '3GB', etc.
}

// ── Daypass 1GB/day (22 plans) ──
const daypass1gb: PkgDef[] = [
  { code: 'A-006-ES-AU-D-I2-1D/60D-1GB', cost: 1.32, days: 1, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-2D/60D-1GB', cost: 1.78, days: 2, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-3D/60D-1GB', cost: 1.96, days: 3, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-4D/60D-1GB', cost: 2.37, days: 4, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-5D/60D-1GB', cost: 2.62, days: 5, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-6D/60D-1GB', cost: 3.01, days: 6, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-7D/60D-1GB', cost: 3.18, days: 7, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-8D/60D-1GB', cost: 3.54, days: 8, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-9D/60D-1GB', cost: 3.88, days: 9, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-10D/60D-1GB', cost: 4.13, days: 10, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-11D/60D-1GB', cost: 4.45, days: 11, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-12D/60D-1GB', cost: 4.80, days: 12, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-13D/60D-1GB', cost: 5.13, days: 13, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-14D/60D-1GB', cost: 5.47, days: 14, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-15D/60D-1GB', cost: 5.81, days: 15, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-16D/60D-1GB', cost: 6.15, days: 16, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-17D/60D-1GB', cost: 6.48, days: 17, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-18D/60D-1GB', cost: 6.82, days: 18, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-19D/60D-1GB', cost: 7.16, days: 19, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-20D/60D-1GB', cost: 7.51, days: 20, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-25D/60D-1GB', cost: 9.19, days: 25, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
  { code: 'A-006-ES-AU-D-I2-30D/60D-1GB', cost: 10.88, days: 30, type: 'day_pass', dataAmt: '1GB/day', dailyGb: '1GB' },
];

// ── Daypass 2GB/day (22 plans) ──
const daypass2gb: PkgDef[] = [
  { code: 'A-006-ES-AU-D-I2-1D/60D-2GB', cost: 1.47, days: 1, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-2D/60D-2GB', cost: 2.25, days: 2, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-3D/60D-2GB', cost: 2.53, days: 3, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-4D/60D-2GB', cost: 3.14, days: 4, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-5D/60D-2GB', cost: 3.75, days: 5, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-6D/60D-2GB', cost: 4.36, days: 6, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-7D/60D-2GB', cost: 4.97, days: 7, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-8D/60D-2GB', cost: 5.57, days: 8, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-9D/60D-2GB', cost: 6.18, days: 9, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-10D/60D-2GB', cost: 6.79, days: 10, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-11D/60D-2GB', cost: 7.40, days: 11, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-12D/60D-2GB', cost: 8.01, days: 12, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-13D/60D-2GB', cost: 8.62, days: 13, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-14D/60D-2GB', cost: 9.23, days: 14, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-15D/60D-2GB', cost: 9.84, days: 15, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-16D/60D-2GB', cost: 10.45, days: 16, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-17D/60D-2GB', cost: 11.06, days: 17, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-18D/60D-2GB', cost: 11.66, days: 18, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-19D/60D-2GB', cost: 12.27, days: 19, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-20D/60D-2GB', cost: 12.88, days: 20, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-25D/60D-2GB', cost: 15.94, days: 25, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
  { code: 'A-006-ES-AU-D-I2-30D/60D-2GB', cost: 18.98, days: 30, type: 'day_pass', dataAmt: '2GB/day', dailyGb: '2GB' },
];

// ── Daypass 3GB/day (22 plans — NEW 0318 codes) ──
const daypass3gb: PkgDef[] = [
  { code: 'A-006-ES-AU-I2-D-0318-1D/60D-3GB', cost: 1.81, days: 1, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-2D/60D-3GB', cost: 2.69, days: 2, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-3D/60D-3GB', cost: 3.36, days: 3, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-4D/60D-3GB', cost: 3.80, days: 4, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-5D/60D-3GB', cost: 4.58, days: 5, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-6D/60D-3GB', cost: 5.35, days: 6, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-7D/60D-3GB', cost: 6.13, days: 7, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-8D/60D-3GB', cost: 6.91, days: 8, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-9D/60D-3GB', cost: 7.67, days: 9, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-10D/60D-3GB', cost: 8.45, days: 10, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-11D/60D-3GB', cost: 9.23, days: 11, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-12D/60D-3GB', cost: 10.01, days: 12, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-13D/60D-3GB', cost: 10.78, days: 13, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-14D/60D-3GB', cost: 11.56, days: 14, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-15D/60D-3GB', cost: 12.34, days: 15, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-16D/60D-3GB', cost: 13.11, days: 16, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-17D/60D-3GB', cost: 13.88, days: 17, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-18D/60D-3GB', cost: 14.66, days: 18, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-19D/60D-3GB', cost: 15.43, days: 19, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-20D/60D-3GB', cost: 16.21, days: 20, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-25D/60D-3GB', cost: 20.08, days: 25, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
  { code: 'A-006-ES-AU-I2-D-0318-30D/60D-3GB', cost: 23.97, days: 30, type: 'day_pass', dataAmt: '3GB/day', dailyGb: '3GB' },
];

// ── Daypass Unlimited (22 plans) ──
const daypassUnlimited: PkgDef[] = [
  { code: 'A-006-ES-AU-D-I2-1D/60D-U', cost: 1.97, days: 1, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-2D/60D-U', cost: 3.24, days: 2, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-3D/60D-U', cost: 4.52, days: 3, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-4D/60D-U', cost: 5.80, days: 4, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-5D/60D-U', cost: 7.07, days: 5, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-6D/60D-U', cost: 8.35, days: 6, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-7D/60D-U', cost: 9.62, days: 7, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-8D/60D-U', cost: 10.89, days: 8, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-9D/60D-U', cost: 12.17, days: 9, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-10D/60D-U', cost: 13.44, days: 10, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-11D/60D-U', cost: 14.72, days: 11, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-12D/60D-U', cost: 15.99, days: 12, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-13D/60D-U', cost: 17.26, days: 13, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-14D/60D-U', cost: 18.54, days: 14, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-15D/60D-U', cost: 19.81, days: 15, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-16D/60D-U', cost: 21.08, days: 16, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-17D/60D-U', cost: 22.36, days: 17, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-18D/60D-U', cost: 23.63, days: 18, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-19D/60D-U', cost: 24.91, days: 19, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-20D/60D-U', cost: 26.18, days: 20, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-25D/60D-U', cost: 32.56, days: 25, type: 'limitless', dataAmt: 'Unlimited' },
  { code: 'A-006-ES-AU-D-I2-30D/60D-U', cost: 38.93, days: 30, type: 'limitless', dataAmt: 'Unlimited' },
];

// ── Data Packages (42 plans: 39 new 0318 + 3 old codes to keep) ──
const dataPackages: PkgDef[] = [
  // 1GB
  { code: 'A-006-ES-AU-T-I2-0318-3D/60D-1GB', cost: 1.36, days: 3, type: 'max_speed', dataAmt: '1GB', totalGb: '1GB' },
  { code: 'A-006-ES-AU-T-I2-0318-5D/60D-1GB', cost: 1.42, days: 5, type: 'max_speed', dataAmt: '1GB', totalGb: '1GB' },
  { code: 'A-006-ES-AU-T-I2-0318-7D/60D-1GB', cost: 1.47, days: 7, type: 'max_speed', dataAmt: '1GB', totalGb: '1GB' },
  { code: 'A-006-ES-AU-T-I2-0318-10D/60D-1GB', cost: 1.53, days: 10, type: 'max_speed', dataAmt: '1GB', totalGb: '1GB' },
  { code: 'A-006-ES-AU-T-I2-0318-15D/60D-1GB', cost: 1.59, days: 15, type: 'max_speed', dataAmt: '1GB', totalGb: '1GB' },
  { code: 'A-006-ES-AU-T-I2-0318-30D/60D-1GB', cost: 1.64, days: 30, type: 'max_speed', dataAmt: '1GB', totalGb: '1GB' },
  // 3GB (includes 1 old code: 5D/60D-3GB)
  { code: 'A-006-ES-AU-T-I2-0318-3D/60D-3GB', cost: 2.03, days: 3, type: 'max_speed', dataAmt: '3GB', totalGb: '3GB' },
  { code: 'A-006-ES-AU-T-I2-5D/60D-3GB', cost: 2.08, days: 5, type: 'max_speed', dataAmt: '3GB', totalGb: '3GB' },  // OLD CODE — keep
  { code: 'A-006-ES-AU-T-I2-0318-7D/60D-3GB', cost: 2.14, days: 7, type: 'max_speed', dataAmt: '3GB', totalGb: '3GB' },
  { code: 'A-006-ES-AU-T-I2-0318-10D/60D-3GB', cost: 2.25, days: 10, type: 'max_speed', dataAmt: '3GB', totalGb: '3GB' },
  { code: 'A-006-ES-AU-T-I2-0318-15D/60D-3GB', cost: 2.31, days: 15, type: 'max_speed', dataAmt: '3GB', totalGb: '3GB' },
  { code: 'A-006-ES-AU-T-I2-0318-30D/60D-3GB', cost: 2.36, days: 30, type: 'max_speed', dataAmt: '3GB', totalGb: '3GB' },
  // 5GB (includes 1 old code: 7D/60D-5GB)
  { code: 'A-006-ES-AU-T-I2-0318-3D/60D-5GB', cost: 2.17, days: 3, type: 'max_speed', dataAmt: '5GB', totalGb: '5GB' },
  { code: 'A-006-ES-AU-T-I2-0318-5D/60D-5GB', cost: 2.31, days: 5, type: 'max_speed', dataAmt: '5GB', totalGb: '5GB' },
  { code: 'A-006-ES-AU-T-7D/60D-5GB', cost: 2.53, days: 7, type: 'max_speed', dataAmt: '5GB', totalGb: '5GB' },  // OLD CODE — keep
  { code: 'A-006-ES-AU-T-I2-0318-10D/60D-5GB', cost: 2.58, days: 10, type: 'max_speed', dataAmt: '5GB', totalGb: '5GB' },
  { code: 'A-006-ES-AU-T-I2-0318-15D/60D-5GB', cost: 2.80, days: 15, type: 'max_speed', dataAmt: '5GB', totalGb: '5GB' },
  { code: 'A-006-ES-AU-T-I2-0318-30D/60D-5GB', cost: 2.97, days: 30, type: 'max_speed', dataAmt: '5GB', totalGb: '5GB' },
  // 10GB (includes 1 old code: 15D/60D-10GB)
  { code: 'A-006-ES-AU-T-I2-0318-3D/60D-10GB', cost: 3.53, days: 3, type: 'max_speed', dataAmt: '10GB', totalGb: '10GB' },
  { code: 'A-006-ES-AU-T-I2-0318-5D/60D-10GB', cost: 3.80, days: 5, type: 'max_speed', dataAmt: '10GB', totalGb: '10GB' },
  { code: 'A-006-ES-AU-T-I2-0318-7D/60D-10GB', cost: 4.02, days: 7, type: 'max_speed', dataAmt: '10GB', totalGb: '10GB' },
  { code: 'A-006-ES-AU-T-I2-0318-10D/60D-10GB', cost: 4.29, days: 10, type: 'max_speed', dataAmt: '10GB', totalGb: '10GB' },
  { code: 'A-006-ES-AU-T-15D/60D-10GB', cost: 4.58, days: 15, type: 'max_speed', dataAmt: '10GB', totalGb: '10GB' },  // OLD CODE — keep
  { code: 'A-006-ES-AU-T-I2-0318-30D/60D-10GB', cost: 4.75, days: 30, type: 'max_speed', dataAmt: '10GB', totalGb: '10GB' },
  // 20GB
  { code: 'A-006-ES-AU-T-I2-0318-3D/60D-20GB', cost: 6.68, days: 3, type: 'max_speed', dataAmt: '20GB', totalGb: '20GB' },
  { code: 'A-006-ES-AU-T-I2-0318-5D/60D-20GB', cost: 6.96, days: 5, type: 'max_speed', dataAmt: '20GB', totalGb: '20GB' },
  { code: 'A-006-ES-AU-T-I2-0318-7D/60D-20GB', cost: 7.35, days: 7, type: 'max_speed', dataAmt: '20GB', totalGb: '20GB' },
  { code: 'A-006-ES-AU-T-I2-0318-10D/60D-20GB', cost: 7.79, days: 10, type: 'max_speed', dataAmt: '20GB', totalGb: '20GB' },
  { code: 'A-006-ES-AU-T-I2-0318-15D/60D-20GB', cost: 8.18, days: 15, type: 'max_speed', dataAmt: '20GB', totalGb: '20GB' },
  { code: 'A-006-ES-AU-T-I2-0318-30D/60D-20GB', cost: 9.01, days: 30, type: 'max_speed', dataAmt: '20GB', totalGb: '20GB' },
  // 30GB
  { code: 'A-006-ES-AU-T-I2-0318-3D/60D-30GB', cost: 9.28, days: 3, type: 'max_speed', dataAmt: '30GB', totalGb: '30GB' },
  { code: 'A-006-ES-AU-T-I2-0318-5D/60D-30GB', cost: 9.56, days: 5, type: 'max_speed', dataAmt: '30GB', totalGb: '30GB' },
  { code: 'A-006-ES-AU-T-I2-0318-7D/60D-30GB', cost: 10.12, days: 7, type: 'max_speed', dataAmt: '30GB', totalGb: '30GB' },
  { code: 'A-006-ES-AU-T-I2-0318-10D/60D-30GB', cost: 10.67, days: 10, type: 'max_speed', dataAmt: '30GB', totalGb: '30GB' },
  { code: 'A-006-ES-AU-T-I2-0318-15D/60D-30GB', cost: 11.22, days: 15, type: 'max_speed', dataAmt: '30GB', totalGb: '30GB' },
  { code: 'A-006-ES-AU-T-I2-0318-30D/60D-30GB', cost: 11.78, days: 30, type: 'max_speed', dataAmt: '30GB', totalGb: '30GB' },
  // 50GB
  { code: 'A-006-ES-AU-T-I2-0318-3D/60D-50GB', cost: 13.72, days: 3, type: 'max_speed', dataAmt: '50GB', totalGb: '50GB' },
  { code: 'A-006-ES-AU-T-I2-0318-5D/60D-50GB', cost: 14.55, days: 5, type: 'max_speed', dataAmt: '50GB', totalGb: '50GB' },
  { code: 'A-006-ES-AU-T-I2-0318-7D/60D-50GB', cost: 15.65, days: 7, type: 'max_speed', dataAmt: '50GB', totalGb: '50GB' },
  { code: 'A-006-ES-AU-T-I2-0318-10D/60D-50GB', cost: 16.77, days: 10, type: 'max_speed', dataAmt: '50GB', totalGb: '50GB' },
  { code: 'A-006-ES-AU-T-I2-0318-15D/60D-50GB', cost: 17.87, days: 15, type: 'max_speed', dataAmt: '50GB', totalGb: '50GB' },
  { code: 'A-006-ES-AU-T-I2-0318-30D/60D-50GB', cost: 18.98, days: 30, type: 'max_speed', dataAmt: '50GB', totalGb: '50GB' },
];

// Old packages to deactivate
const DEACTIVATE_CODES = [
  'A-006-ES-AU-T-I2-20D/60D-15GB',
  'A-006-ES-AU-T-I2-30D/60D-20GB',
  'A-006-ES-AU-T-I2-30D/60D-30GB',
  'A-006-ES-AU-T-I2-30D/60D-40GB',
  'A-006-ES-AU-T-I2-30D/60D-50GB',
];

const ALL_PACKAGES: PkgDef[] = [
  ...daypass1gb,
  ...daypass2gb,
  ...daypass3gb,
  ...daypassUnlimited,
  ...dataPackages,
];

function buildName(pkg: PkgDef): string {
  if (pkg.type === 'limitless') return `Japan Unlimited/day, ${pkg.days} days`;
  if (pkg.type === 'day_pass') return `Japan ${pkg.dailyGb}/day, ${pkg.days} days`;
  return `Japan ${pkg.totalGb}, ${pkg.days} days`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`[IMPORT-I2-JAPAN] Starting import of ${ALL_PACKAGES.length} packages...`);

    const results = { upserted: 0, deactivated: 0, errors: [] as any[] };

    // Upsert all 130 packages
    for (const pkg of ALL_PACKAGES) {
      try {
        const retailPrice = Math.round(pkg.cost * MARKUP * 100) / 100;
        const name = buildName(pkg);

        const record: Record<string, unknown> = {
          package_id: pkg.code,
          name,
          country_code: 'JP',
          country_name: 'Japan',
          data_amount: pkg.dataAmt,
          validity_days: pkg.days,
          price: retailPrice,
          normal_price: retailPrice,
          currency: 'USD',
          is_active: true,
          carrier: 'Docomo',
          package_type: pkg.type,
          provider_id: TUGE_PROVIDER_ID,
          cost_price: pkg.cost,
          network_type: '4G',
          sim_type: 'eSIM',
          category: 'country',
          is_local_sim: true,
          top_up: true,
          provider_metadata: { card_type: 'i2', source: 'import-i2-japan-q1-2026' },
        };

        // Type-specific fields
        if (pkg.type === 'day_pass') {
          record.daily_data_reset = true;
          record.daily_reset_amount = pkg.dailyGb!;
          record.speed_after_limit = '256kbps';
          record.qos_speed = null;
        } else if (pkg.type === 'limitless') {
          record.daily_data_reset = true;
          record.daily_reset_amount = null;
          record.qos_speed = 'Unlimited';
          record.speed_after_limit = null;
        } else {
          // max_speed
          record.daily_data_reset = false;
          record.daily_reset_amount = null;
          record.qos_speed = 'Max Speed';
          record.speed_after_limit = null;
        }

        const { error } = await supabase
          .from('esim_packages')
          .upsert(record, { onConflict: 'package_id' });

        if (error) {
          console.error(`[IMPORT-I2-JAPAN] Upsert error for ${pkg.code}:`, error);
          results.errors.push({ code: pkg.code, error: error.message });
        } else {
          results.upserted++;
        }
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push({ code: pkg.code, error: msg });
      }
    }

    // Deactivate 5 old packages
    for (const code of DEACTIVATE_CODES) {
      const { error } = await supabase
        .from('esim_packages')
        .update({ is_active: false })
        .eq('package_id', code);

      if (error) {
        console.error(`[IMPORT-I2-JAPAN] Deactivate error for ${code}:`, error);
        results.errors.push({ code, error: error.message, action: 'deactivate' });
      } else {
        results.deactivated++;
      }
    }

    console.log(`[IMPORT-I2-JAPAN] Done. Upserted: ${results.upserted}, Deactivated: ${results.deactivated}, Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_packages: ALL_PACKAGES.length,
        upserted: results.upserted,
        deactivated: results.deactivated,
        errors: results.errors.length,
      },
      errors: results.errors,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[IMPORT-I2-JAPAN] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
