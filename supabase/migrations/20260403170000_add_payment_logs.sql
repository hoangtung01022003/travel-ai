-- ============================================================
-- Migration: Add payment_logs table for VNPay audit
-- Date: 20260403
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id     UUID          REFERENCES bookings(id) ON DELETE SET NULL,
  source         TEXT          NOT NULL CHECK (source IN ('callback', 'ipn')),
  raw_query      JSONB         NOT NULL DEFAULT '{}',
  response_code  TEXT,
  is_valid_sig   BOOLEAN       NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_booking  ON payment_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created  ON payment_logs(created_at DESC);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can view payment logs
DROP POLICY IF EXISTS "Admin can view payment logs" ON payment_logs;
CREATE POLICY "Admin can view payment logs"
  ON payment_logs FOR SELECT
  USING (is_admin());

-- Service role (backend) can insert

DROP POLICY IF EXISTS "Service role can insert payment logs" ON payment_logs;
CREATE POLICY "Service role can insert payment logs"
  ON payment_logs FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE payment_logs IS
  'Audit log cho tất cả VNPay callback (browser) và IPN (server-to-server)';
