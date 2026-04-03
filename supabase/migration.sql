-- ============================================================
-- LYXAA BOOKING SYSTEM — DATABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- STEP 1: Add missing columns to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS hours text DEFAULT '';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS topics text[] DEFAULT '{}';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS languages text DEFAULT 'English';

-- STEP 2: Add missing column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS focus text DEFAULT '';

-- STEP 3: Enable RLS policies for public read access
-- (These may already exist — IF NOT EXISTS prevents errors)

-- Allow public (anon) to read doctors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'doctors' AND policyname = 'Allow public read access on doctors'
  ) THEN
    CREATE POLICY "Allow public read access on doctors" ON doctors FOR SELECT USING (true);
  END IF;
END $$;

-- Allow public (anon) to read services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Allow public read access on services'
  ) THEN
    CREATE POLICY "Allow public read access on services" ON services FOR SELECT USING (true);
  END IF;
END $$;

-- Allow public (anon) to insert bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Allow public insert on bookings'
  ) THEN
    CREATE POLICY "Allow public insert on bookings" ON bookings FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- STEP 4: Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('doctors', 'services', 'bookings')
ORDER BY table_name, ordinal_position;
