-- ============================================================
-- Migration: Add Booking System
-- Date: 20260403
-- Description: Tạo bảng bookings + tour_tags, mở rộng tours
--              RLS policies, triggers, indexes
-- ============================================================


-- ============================================================
-- 0. ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'unpaid',
    'paid',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================================
-- 1. MỞ RỘNG BẢNG tours (thêm các cột cho booking system)
-- ============================================================

ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS booking_count    INT         DEFAULT 0,       -- Tổng lượt đặt đã confirmed
  ADD COLUMN IF NOT EXISTS available_slots  INT         DEFAULT NULL,    -- NULL = không giới hạn slot
  ADD COLUMN IF NOT EXISTS start_dates      DATE[]      DEFAULT '{}',    -- Các ngày khởi hành có thể chọn
  ADD COLUMN IF NOT EXISTS includes         TEXT[]      DEFAULT '{}',    -- Bao gồm: ăn sáng, vé máy bay...
  ADD COLUMN IF NOT EXISTS excludes         TEXT[]      DEFAULT '{}';    -- Không bao gồm: visa, tip...

COMMENT ON COLUMN tours.booking_count   IS 'Tổng số người đã booking confirmed';
COMMENT ON COLUMN tours.available_slots IS 'NULL = không giới hạn; số nguyên = còn bấy nhiêu chỗ';
COMMENT ON COLUMN tours.start_dates     IS 'Mảng ngày khởi hành, người dùng chọn một trong số này';


-- ============================================================
-- 2. BẢNG tour_tags (junction table — dùng cho AI filter)
-- ============================================================

CREATE TABLE IF NOT EXISTS tour_tags (
  tour_id  UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (tour_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tour_tags_tour ON tour_tags(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_tags_tag  ON tour_tags(tag_id);

COMMENT ON TABLE tour_tags IS 'Junction table: Tour ↔ Tag — dùng để AI Planner filter tour theo tags của itinerary';


-- ============================================================
-- 3. BẢNG bookings (bảng trung tâm của booking system)
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
  -- Identity
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  user_id          UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tour_id          UUID          NOT NULL REFERENCES tours(id)    ON DELETE RESTRICT, -- không xóa tour khi còn booking

  -- Booking info
  status           booking_status NOT NULL DEFAULT 'pending',
  num_people       INT           NOT NULL CHECK (num_people >= 1),
  travel_date      DATE          NOT NULL,
  total_price      NUMERIC(12,0) NOT NULL CHECK (total_price >= 0),  -- VNĐ; = tour.price × num_people tại thời điểm đặt
  note             TEXT,

  -- Payment
  payment_method   TEXT          NOT NULL DEFAULT 'vnpay',         -- 'vnpay' | 'cash' | v.v
  payment_ref      TEXT          UNIQUE,                            -- Mã giao dịch VNPay (vnp_TxnRef)
  payment_status   payment_status NOT NULL DEFAULT 'unpaid',
  paid_at          TIMESTAMPTZ,                                     -- Thời điểm thanh toán thành công

  -- Timestamps
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  bookings                  IS 'Bảng lưu tất cả lượt đặt tour của người dùng';
COMMENT ON COLUMN bookings.total_price      IS 'Giá tổng tại thời điểm đặt (snapshot), tính = tour.price × num_people';
COMMENT ON COLUMN bookings.payment_ref      IS 'Mã tham chiếu giao dịch VNPay (vnp_TxnRef), unique để idempotent callback';
COMMENT ON COLUMN bookings.travel_date      IS 'Ngày khởi hành user chọn, phải thuộc tours.start_dates nếu có';


-- ============================================================
-- 4. INDEXES
-- ============================================================

-- Lookup bookings của 1 user (trang /my-tours)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id      ON bookings(user_id);

-- Lookup bookings của 1 tour (admin view, check slot)
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id      ON bookings(tour_id);

-- Filter theo status (admin: 'pending', 'confirmed', ...)
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(status);

-- Filter theo ngày du lịch
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date  ON bookings(travel_date);

-- Lookup booking theo payment_ref (VNPay callback)
CREATE INDEX IF NOT EXISTS idx_bookings_payment_ref  ON bookings(payment_ref)
  WHERE payment_ref IS NOT NULL;

-- Composite: các booking đang pending của 1 tour tại 1 ngày (check availability)
CREATE INDEX IF NOT EXISTS idx_bookings_tour_date_status
  ON bookings(tour_id, travel_date, status)
  WHERE status IN ('pending', 'confirmed');


-- ============================================================
-- 5. TRIGGER: auto update updated_at
-- ============================================================

-- Hàm update_updated_at() đã có từ migration trước, tái sử dụng
DROP TRIGGER IF EXISTS update_bookings_timestamp ON bookings;

CREATE TRIGGER update_bookings_timestamp
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. TRIGGER: cộng booking_count vào tours khi confirmed
--            trừ booking_count khi cancelled/refunded từ confirmed
-- ============================================================

CREATE OR REPLACE FUNCTION sync_tour_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Khi booking chuyển sang 'confirmed' (từ bất kỳ status nào khác)
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') THEN
    UPDATE tours
      SET booking_count = booking_count + NEW.num_people
    WHERE id = NEW.tour_id;
  END IF;

  -- Khi booking bị hủy/hoàn tiền TỪ trạng thái 'confirmed'
  -- → hoàn lại slot (trừ đi số người đã cộng trước đó)
  IF OLD.status = 'confirmed' AND NEW.status IN ('cancelled', 'refunded') THEN
    UPDATE tours
      SET booking_count = GREATEST(0, booking_count - OLD.num_people)
    WHERE id = OLD.tour_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_tour_booking_count() IS
  'Tự động cập nhật tours.booking_count khi booking status thay đổi: +num_people khi confirmed, -num_people khi cancelled/refunded từ confirmed';
DROP TRIGGER IF EXISTS trg_sync_tour_booking_count ON bookings;

CREATE TRIGGER trg_sync_tour_booking_count
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_tour_booking_count();

-- Trigger cho INSERT mới với status = 'confirmed' ngay từ đầu (ít dùng nhưng an toàn)
DROP TRIGGER IF EXISTS trg_sync_tour_booking_count_insert ON bookings;
CREATE TRIGGER trg_sync_tour_booking_count_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION sync_tour_booking_count();


-- ============================================================
-- 7. ROW LEVEL SECURITY — bookings
-- ============================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- User chỉ xem booking của chính mình
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- User chỉ tạo booking cho chính mình (không giả mạo user_id)
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
CREATE POLICY "Users can create own bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User có thể hủy booking của mình (chỉ khi đang pending)
-- Logic giới hạn thêm (chỉ hủy được pending) nên xử lý ở server action
DROP POLICY IF EXISTS "Users can cancel own bookings" ON bookings;
CREATE POLICY "Users can cancel own bookings"
  ON bookings
  FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin xem tất cả bookings
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
CREATE POLICY "Admin can view all bookings"
  ON bookings
  FOR SELECT
  USING (is_admin());

-- Admin có thể update bất kỳ booking nào (đổi status, cập nhật payment)
DROP POLICY IF EXISTS "Admin can update any booking" ON bookings;
CREATE POLICY "Admin can update any booking"
  ON bookings
  FOR UPDATE
  USING (is_admin());

-- Admin có thể xóa booking (edge case: test data cleanup)
DROP POLICY IF EXISTS "Admin can delete bookings" ON bookings;
CREATE POLICY "Admin can delete bookings"
  ON bookings
  FOR DELETE
  USING (is_admin());


-- ============================================================
-- 8. ROW LEVEL SECURITY — tour_tags
-- ============================================================

ALTER TABLE tour_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tour tags viewable by everyone" ON tour_tags;
CREATE POLICY "Tour tags viewable by everyone"
  ON tour_tags
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage tour tags" ON tour_tags;
CREATE POLICY "Admin can manage tour tags"
  ON tour_tags
  FOR ALL
  USING (is_admin());


-- ============================================================
-- 9. HELPER VIEW: booking_summary (tiện cho admin dashboard)
-- ============================================================

CREATE OR REPLACE VIEW booking_summary AS
SELECT
  b.id,
  b.status,
  b.payment_status,
  b.num_people,
  b.travel_date,
  b.total_price,
  b.payment_method,
  b.payment_ref,
  b.paid_at,
  b.created_at,
  b.updated_at,
  -- Tour info
  t.name       AS tour_name,
  t.slug       AS tour_slug,
  t.price      AS tour_unit_price,
  -- User info
  p.full_name  AS user_name,
  p.email      AS user_email,
  p.phone      AS user_phone
FROM bookings       b
JOIN tours          t ON t.id = b.tour_id
JOIN profiles       p ON p.id = b.user_id;

COMMENT ON VIEW booking_summary IS
  'Denormalized view dùng cho admin dashboard — join bookings với tours và profiles';
