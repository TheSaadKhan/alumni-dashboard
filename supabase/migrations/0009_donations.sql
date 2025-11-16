-- 0009_donations.sql
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  tenant_id uuid,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  donor_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  campaign_id uuid, -- Will reference donation_campaigns table
  
  amount numeric(12,2) CHECK (amount >= 0),
  currency char(3) DEFAULT 'USD',
  status text DEFAULT 'pending', -- pending, processing, completed, failed, refunded, cancelled
  
  -- NEW: Enhanced payment fields
  fee_amount numeric(12,2) CHECK (fee_amount >= 0),
  net_amount numeric(12,2) CHECK (net_amount >= 0),
  tax_amount numeric(12,2) CHECK (tax_amount >= 0),
  
  -- NEW: Payment provider details
  provider_name text, -- stripe, paypal, bank_transfer, etc.
  provider_transaction_id text,
  provider_customer_id text,
  provider_payment_method_id text,
  
  -- NEW: Recurring donations
  is_recurring boolean DEFAULT false,
  recurring_interval text, -- monthly, quarterly, yearly
  recurring_end_date timestamptz,
  parent_donation_id uuid REFERENCES public.donations(id), -- For recurring donation series
  
  -- NEW: Donation details
  donation_type text DEFAULT 'general', -- general, scholarship, research, facility, emergency
  designation text, -- Specific fund or purpose
  is_anonymous boolean DEFAULT false,
  is_tax_deductible boolean DEFAULT false,
  dedication text, -- In honor/memory of someone
  comments text,
  
  -- NEW: Receipt and acknowledgment
  receipt_sent_at timestamptz,
  receipt_number text,
  acknowledgment_sent_at timestamptz,
  acknowledgment_method text, -- email, letter, both
  
  -- NEW: Refund information
  refunded_at timestamptz,
  refund_amount numeric(12,2) CHECK (refund_amount >= 0),
  refund_reason text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Donation campaigns table
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  title text NOT NULL,
  description text,
  short_description text,
  
  -- NEW: Campaign goals and tracking
  goal_amount numeric(12,2) CHECK (goal_amount >= 0),
  current_amount numeric(12,2) DEFAULT 0 CHECK (current_amount >= 0),
  donor_count integer DEFAULT 0 CHECK (donor_count >= 0),
  
  -- NEW: Campaign timing
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  
  -- NEW: Campaign media
  banner_url text,
  video_url text,
  images jsonb DEFAULT '[]'::jsonb,
  
  -- NEW: Campaign settings
  allow_recurring boolean DEFAULT true,
  allow_anonymous boolean DEFAULT true,
  allow_comments boolean DEFAULT true,
  minimum_amount numeric(12,2) DEFAULT 1 CHECK (minimum_amount >= 0),
  
  -- NEW: Campaign categories
  campaign_type text DEFAULT 'general', -- scholarship, research, emergency, capital, annual
  categories text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Donation receipts table
CREATE TABLE IF NOT EXISTS public.donation_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  receipt_number text NOT NULL UNIQUE,
  receipt_date date NOT NULL,
  fiscal_year integer NOT NULL,
  
  -- NEW: Receipt details
  donor_name text NOT NULL,
  donor_address jsonb,
  donor_email text,
  donor_phone text,
  
  amount numeric(12,2) NOT NULL,
  currency char(3) DEFAULT 'USD',
  is_tax_deductible boolean DEFAULT false,
  tax_deductible_amount numeric(12,2),
  
  -- NEW: Receipt status
  status text DEFAULT 'draft', -- draft, sent, delivered, failed
  sent_at timestamptz,
  sent_via text, -- email, mail, both
  delivery_failure_reason text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);