-- ============================================================
-- Migration: Add Auto Booking Status Cron
-- Date: 20260411
-- Description: Tự động chuyển status sang 'completed' khi hết hạn 
--              và 'cancelled' nếu quá hạn thanh toán.
-- ============================================================

-- 1. Kích hoạt Extension pg_cron (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Tạo Function xử lý logic (chống lỗi nếu chạy lại nhiều lần bằng OR REPLACE)
CREATE OR REPLACE FUNCTION public.handle_auto_booking_status_updates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    now_vn date;
BEGIN
    -- Lấy ngày hiện tại theo múi giờ Việt Nam
    now_vn := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

    -- CASE 1: Cập nhật thành 'completed'
    UPDATE public.bookings b
    SET 
        status = 'completed',
        updated_at = NOW()
    FROM public.tours t
    WHERE b.status = 'confirmed'
    AND (
        (b.booking_type = 'tour' AND b.tour_id = t.id AND (b.travel_date + t.duration_days) < now_vn)
        OR
        (b.booking_type = 'hotel' AND (b.travel_date + b.num_people) < now_vn)
    );

    -- CASE 2: Cập nhật thành 'cancelled' (quá hạn travel_date mà vẫn unpaid)
    UPDATE public.bookings
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE 
        status = 'pending' 
        AND payment_status = 'unpaid' 
        AND (
            travel_date <= now_vn -- Đã đến ngày đi
            OR 
            created_at < (NOW() - INTERVAL '1 hour') -- Hoặc đã đặt quá 1 tiếng mà chưa trả tiền
        );
END;
$$;

-- 3. Thiết lập Cron Job 
-- Xóa job cũ nếu tồn tại để tránh trùng lặp khi chạy lại migration
DO $$
BEGIN
    PERFORM cron.unschedule('auto-update-booking-status');
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Lập lịch: Chạy 10 phút một lần để đảm bảo ổn định và chính xác
SELECT cron.schedule(
    'auto-update-booking-status',
    '*/10 * * * *',
    'SELECT public.handle_auto_booking_status_updates()'
);

COMMENT ON FUNCTION public.handle_auto_booking_status_updates() IS 'Tự động cập nhật trạng thái booking dựa trên ngày khởi hành/kết thúc - Chạy hàng ngày qua pg_cron';
