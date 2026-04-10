-- ============================================================
-- Migration: Concurrency and RLS Optimization
-- Date: 20260410
-- Description:
--   - Thay thế các sub-query trong RLS bằng kiểm tra JWT (O(1))
--   - Tối ưu hóa các chính sách (Policies) để giảm tải I/O
--   - Bổ sung Index hỗ trợ kiểm tra quyền sở hữu bản ghi
-- ============================================================

-- 1. Đảm bảo hàm is_admin() đã được tối ưu (đã làm ở bước trước, nhưng chạy lại cho chắc chắn)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
$$;

-- 2. Tối ưu RLS cho bảng BOOKINGS
-- Thay vì check is_admin() qua bảng profiles, dùng hàm mới đã tối ưu
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
CREATE POLICY "Admin can view all bookings" ON bookings FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin can update any booking" ON bookings;
CREATE POLICY "Admin can update any booking" ON bookings FOR UPDATE USING (is_admin());

-- 3. Tối ưu RLS cho bảng REVIEWS
-- Chính sách cũ rất phức tạp: (is_visible = TRUE OR auth.uid() = user_id OR is_admin())
-- Chia nhỏ thành các policy đơn giản để Postgres Optimizer hoạt động tốt hơn
DROP POLICY IF EXISTS "Visible reviews viewable by everyone" ON reviews;

CREATE POLICY "Anyone can view visible reviews" ON reviews FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Users can view own hidden reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all reviews" ON reviews FOR SELECT USING (is_admin());

-- 4. Tối ưu RLS cho các bảng Tours/Hotels/Destinations
DROP POLICY IF EXISTS "Admin can manage tours" ON tours;
CREATE POLICY "Admin can manage tours" ON tours FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin can manage hotels" ON hotels;
CREATE POLICY "Admin can manage hotels" ON hotels FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin can manage destinations" ON destinations;
CREATE POLICY "Admin can manage destinations" ON destinations FOR ALL USING (is_admin());

-- 5. Bổ sung INDEX để tăng tốc RLS (Giảm thiểu Table Scan khi check auth.uid())
CREATE INDEX IF NOT EXISTS idx_bookings_user_id_auth ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id_auth ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id_auth ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_user_id_auth ON ai_itineraries(user_id);

-- 6. Tối ưu hóa VIEW booking_summary
-- Đảm bảo View này chạy mượt mà khi JOIN profiles
-- (View không có RLS riêng, nó kế thừa RLS từ các bảng gốc)
-- Việc tối ưu RLS ở trên sẽ tự động làm View này nhanh hơn.

COMMENT ON FUNCTION is_admin() IS 'Kiểm tra quyền admin từ JWT metadata - Không truy vấn Database - Fix lỗi nghẽn connection khi nhiều user';
