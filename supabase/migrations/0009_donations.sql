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

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Donations
CREATE POLICY "Donors can view their own donations" ON public.donations
  FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Donors can create donations" ON public.donations
  FOR INSERT WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Organization members can view donations in their org" ON public.donations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'view_donations' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage donations" ON public.donations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_donations' = 'true'
      )
    )
  );

-- RLS Policies for Donation Campaigns
CREATE POLICY "Anyone can view active campaigns" ON public.donation_campaigns
  FOR SELECT USING (is_active = true);

CREATE POLICY "Organization members can create campaigns" ON public.donation_campaigns
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_campaigns' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage campaigns" ON public.donation_campaigns
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_campaigns' = 'true'
      )
    )
  );

-- RLS Policies for Donation Receipts
CREATE POLICY "Donors can view their own receipts" ON public.donation_receipts
  FOR SELECT USING (
    donation_id IN (
      SELECT id FROM public.donations WHERE donor_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage receipts" ON public.donation_receipts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_donations' = 'true'
      )
    )
  );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_donation_campaigns_updated_at
  BEFORE UPDATE ON public.donation_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_donation_receipts_updated_at
  BEFORE UPDATE ON public.donation_receipts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations (created_at);
CREATE INDEX IF NOT EXISTS idx_donations_organization_id ON public.donations (organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations (donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations (status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON public.donations (campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_is_recurring ON public.donations (is_recurring);
CREATE INDEX IF NOT EXISTS idx_donations_donation_type ON public.donations (donation_type);

CREATE INDEX IF NOT EXISTS idx_donation_campaigns_organization_id ON public.donation_campaigns (organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_is_active ON public.donation_campaigns (is_active);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_is_featured ON public.donation_campaigns (is_featured);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_start_date ON public.donation_campaigns (start_date);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_end_date ON public.donation_campaigns (end_date);

CREATE INDEX IF NOT EXISTS idx_donation_receipts_donation_id ON public.donation_receipts (donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_organization_id ON public.donation_receipts (organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_receipt_number ON public.donation_receipts (receipt_number);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_fiscal_year ON public.donation_receipts (fiscal_year);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_donation_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from campaign if provided
  IF NEW.organization_id IS NULL AND NEW.campaign_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.donation_campaigns
    WHERE id = NEW.campaign_id;
  END IF;
  
  -- Set donor_member_id if organization is found
  IF NEW.organization_id IS NOT NULL AND NEW.donor_id IS NOT NULL THEN
    SELECT om.id INTO NEW.donor_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.donor_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Calculate net amount if not provided
  IF NEW.net_amount IS NULL THEN
    NEW.net_amount = NEW.amount - COALESCE(NEW.fee_amount, 0) - COALESCE(NEW.tax_amount, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_donation_organization_trigger
  BEFORE INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.set_donation_organization();

-- Function to update campaign totals
CREATE OR REPLACE FUNCTION public.update_campaign_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE public.donation_campaigns
    SET 
      current_amount = current_amount + NEW.amount,
      donor_count = donor_count + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE public.donation_campaigns
    SET 
      current_amount = current_amount + NEW.amount,
      donor_count = donor_count + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE public.donation_campaigns
    SET 
      current_amount = current_amount - OLD.amount,
      donor_count = donor_count - 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_totals_trigger
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_totals();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number(
  p_organization_id uuid,
  p_fiscal_year integer
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_shortcode text;
  v_sequence_number integer;
  v_receipt_number text;
BEGIN
  -- Get organization shortcode (first 3 letters of name)
  SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO v_org_shortcode
  FROM public.organizations
  WHERE id = p_organization_id;
  
  -- Get next sequence number for this org and fiscal year
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO v_sequence_number
  FROM public.donation_receipts
  WHERE organization_id = p_organization_id
    AND fiscal_year = p_fiscal_year;
  
  -- Format receipt number: ORG-YYYY-NNNN
  v_receipt_number := v_org_shortcode || '-' || p_fiscal_year || '-' || LPAD(v_sequence_number::text, 4, '0');
  
  RETURN v_receipt_number;
END;
$$;

-- Function to create receipt for donation
CREATE OR REPLACE FUNCTION public.create_donation_receipt(
  p_donation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_donation_record RECORD;
  v_receipt_id uuid;
  v_fiscal_year integer;
  v_receipt_number text;
BEGIN
  -- Get donation details
  SELECT d.*, p.full_name, p.email, p.primary_organization_id
  INTO v_donation_record
  FROM public.donations d
  JOIN public.profiles p ON d.donor_id = p.id
  WHERE d.id = p_donation_id;
  
  -- Calculate fiscal year (assuming calendar year)
  v_fiscal_year := EXTRACT(YEAR FROM v_donation_record.created_at);
  
  -- Generate receipt number
  v_receipt_number := public.generate_receipt_number(v_donation_record.organization_id, v_fiscal_year);
  
  -- Create receipt
  INSERT INTO public.donation_receipts (
    donation_id,
    organization_id,
    receipt_number,
    receipt_date,
    fiscal_year,
    donor_name,
    donor_email,
    amount,
    currency,
    is_tax_deductible,
    tax_deductible_amount,
    status
  ) VALUES (
    p_donation_id,
    v_donation_record.organization_id,
    v_receipt_number,
    CURRENT_DATE,
    v_fiscal_year,
    v_donation_record.full_name,
    v_donation_record.email,
    v_donation_record.amount,
    v_donation_record.currency,
    v_donation_record.is_tax_deductible,
    CASE WHEN v_donation_record.is_tax_deductible THEN v_donation_record.amount ELSE 0 END,
    'draft'
  ) RETURNING id INTO v_receipt_id;
  
  -- Update donation with receipt sent time
  UPDATE public.donations
  SET receipt_sent_at = NOW()
  WHERE id = p_donation_id;
  
  RETURN v_receipt_id;
END;
$$;

-- Function to get donation statistics
CREATE OR REPLACE FUNCTION public.get_donation_stats(
  p_organization_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_donations bigint,
  total_amount numeric,
  average_donation numeric,
  largest_donation numeric,
  recurring_donations_count bigint,
  unique_donors_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_donations,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(AVG(amount), 0) as average_donation,
    COALESCE(MAX(amount), 0) as largest_donation,
    COUNT(*) FILTER (WHERE is_recurring = true) as recurring_donations_count,
    COUNT(DISTINCT donor_id) as unique_donors_count
  FROM public.donations
  WHERE organization_id = p_organization_id
    AND status = 'completed'
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- View for enhanced donation details
CREATE OR REPLACE VIEW public.donation_details AS
SELECT 
  d.*,
  p.full_name as donor_name,
  p.email as donor_email,
  p.avatar_url as donor_avatar,
  org.name as organization_name,
  dc.title as campaign_title,
  dm.title as donor_title,
  dm.department as donor_department
FROM public.donations d
LEFT JOIN public.profiles p ON d.donor_id = p.id
LEFT JOIN public.organizations org ON d.organization_id = org.id
LEFT JOIN public.donation_campaigns dc ON d.campaign_id = dc.id
LEFT JOIN public.organization_members dm ON d.donor_member_id = dm.id;

-- View for campaign details with progress
CREATE OR REPLACE VIEW public.campaign_details AS
SELECT 
  dc.*,
  org.name as organization_name,
  COALESCE(dc.current_amount, 0) as raised_amount,
  CASE 
    WHEN dc.goal_amount > 0 THEN (dc.current_amount / dc.goal_amount) * 100 
    ELSE 0 
  END as progress_percentage,
  CASE 
    WHEN dc.end_date < NOW() THEN 'ended'
    WHEN dc.start_date > NOW() THEN 'upcoming'
    ELSE 'active'
  END as campaign_status,
  COUNT(DISTINCT d.donor_id) as actual_donor_count
FROM public.donation_campaigns dc
JOIN public.organizations org ON dc.organization_id = org.id
LEFT JOIN public.donations d ON dc.id = d.campaign_id AND d.status = 'completed'
GROUP BY dc.id, org.name;