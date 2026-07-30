-- =====================================================================
-- Vibely — M-Pesa subscriptions (0008)
-- The subscriptions & payments tables already exist (0001). This adds a
-- `tier` column to payments so the STK Push callback knows which tier a
-- successful payment unlocks. Run after 0007_verification.sql.
-- =====================================================================
alter table public.payments
  add column if not exists tier sub_tier_t;
