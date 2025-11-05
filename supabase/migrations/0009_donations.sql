-- 0009_donations.sql
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid,
  tenant_id uuid,
  amount numeric(12,2) CHECK (amount >= 0),
  currency char(3) DEFAULT 'USD',
  status text DEFAULT 'pending',
  provider_transaction_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations (created_at);
