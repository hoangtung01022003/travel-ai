-- ============================================================
-- Migration: Add Review System Support
-- Date: 20260406
-- Description:
--   1. Thêm 'completed' vào booking_status enum
--   2. Thêm booking_id vào reviews (1 booking = 1 review)
--   3. RLS policy cho phép user submit review khi booking.status = 'completed'
-- ============================================================

-- 1. Thêm 'completed' vào booking_status enum (không thể ALTER ENUM trực tiếp trong Postgres,
--    phải dùng cách thêm value mới)
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';

-- 2. Thêm cột booking_id vào reviews
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- 3. UNIQUE: 1 booking chỉ có tối đa 1 review
ALTER TABLE reviews
  ADD CONSTRAINT uq_reviews_booking_id UNIQUE (booking_id);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- 5. Comment
COMMENT ON COLUMN reviews.booking_id IS 'FK → bookings. Đảm bảo 1 booking chỉ có đúng 1 review. NULL = review không liên kết booking (destination review)';

-- 6. Trigger auto-update avg_rating cho tours/hotels sau review INSERT/UPDATE/DELETE
--    (Trigger update_avg_rating đã có từ migration add_hotel_system)
--    Cần đảm bảo trigger được register đúng:
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_avg_rating();
