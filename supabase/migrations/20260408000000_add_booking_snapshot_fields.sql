-- ============================================================
-- Migration: Add booking snapshot fields
-- Date: 20260408
-- Description:
--   - Thêm item_name, item_price_snapshot để lưu tên và giá tại
--     thời điểm user đặt — booking không bị ảnh hưởng khi
--     admin update/xóa tour hoặc hotel
--   - Cập nhật booking_summary view để dùng snapshot fields
-- ============================================================

-- 1. Snapshot tên tour/hotel tại thời điểm đặt
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS item_name            TEXT,
  ADD COLUMN IF NOT EXISTS item_price_snapshot  NUMERIC(12,0);

-- 2. Backfill existing rows từ tours / hotels JOIN
UPDATE bookings b
SET
  item_name           = t.name,
  item_price_snapshot = t.price
FROM tours t
WHERE b.tour_id = t.id AND b.item_name IS NULL;

UPDATE bookings b
SET
  item_name           = h.name,
  item_price_snapshot = h.min_price
FROM hotels h
WHERE b.hotel_id = h.id AND b.item_name IS NULL;

COMMENT ON COLUMN bookings.item_name           IS 'Snapshot tên tour/hotel tại thời điểm đặt — không thay đổi theo update admin';
COMMENT ON COLUMN bookings.item_price_snapshot IS 'Snapshot đơn giá (VNĐ/người hoặc VNĐ/đêm) tại thời điểm đặt';

-- ============================================================
-- 3. Cập nhật booking_summary view — dùng snapshot, không JOIN live data
-- ============================================================

CREATE OR REPLACE VIEW booking_summary AS
SELECT
  b.id,
  b.status,
  b.payment_status,
  b.booking_type,
  b.num_people,
  b.travel_date,
  b.total_price,
  b.payment_method,
  b.payment_ref,
  b.paid_at,
  b.note,
  b.created_at,
  b.updated_at,
  -- Snapshot tại thời điểm đặt (ưu tiên dùng)
  b.item_name            AS item_name,
  b.item_price_snapshot  AS item_price_snapshot,
  -- FK refs (dùng cho navigation link nếu cần)
  b.tour_id,
  b.hotel_id,
  -- User info
  p.full_name  AS user_name,
  p.email      AS user_email,
  p.phone      AS user_phone
FROM bookings       b
JOIN profiles       p ON p.id = b.user_id;

COMMENT ON VIEW booking_summary IS
  'Denormalized view dùng cho admin dashboard — dùng snapshot fields để hiển thị tên/giá, không JOIN live tours/hotels';

