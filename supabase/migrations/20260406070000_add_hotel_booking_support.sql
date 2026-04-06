-- ============================================================
-- Migration: Add hotel booking support
-- Date: 20260406
-- Description: 
--   - Thêm cột hotel_id (nullable) vào bookings
--   - Làm tour_id nullable (hotel booking không có tour_id)
--   - Thêm CHECK constraint: phải có ít nhất 1 trong tour_id hoặc hotel_id
--   - Thêm cột booking_type để phân biệt 'tour' | 'hotel'
-- ============================================================

-- 1. Làm tour_id nullable (hotel booking không có tour_id)
ALTER TABLE bookings
  ALTER COLUMN tour_id DROP NOT NULL;

-- 2. Thêm hotel_id (FK → hotels, nullable)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE RESTRICT;

-- 3. Thêm booking_type để phân biệt loại booking
DO $$ BEGIN
  CREATE TYPE booking_type AS ENUM ('tour', 'hotel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_type booking_type NOT NULL DEFAULT 'tour';

-- Backfill existing rows
UPDATE bookings SET booking_type = 'tour' WHERE booking_type IS NULL;

-- 4. Constraint: phải có đúng 1 trong tour_id hoặc hotel_id
ALTER TABLE bookings
  ADD CONSTRAINT chk_booking_has_target
  CHECK (
    (booking_type = 'tour'  AND tour_id  IS NOT NULL AND hotel_id IS NULL) OR
    (booking_type = 'hotel' AND hotel_id IS NOT NULL AND tour_id  IS NULL)
  );

-- 5. Index cho hotel_id
CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings(hotel_id);

-- 6. Update comment
COMMENT ON COLUMN bookings.tour_id     IS 'FK → tours. NULL khi booking_type = hotel';
COMMENT ON COLUMN bookings.hotel_id    IS 'FK → hotels. NULL khi booking_type = tour';
COMMENT ON COLUMN bookings.booking_type IS 'Loại booking: tour | hotel';
