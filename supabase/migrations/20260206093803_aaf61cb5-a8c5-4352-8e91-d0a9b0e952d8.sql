-- Create system_settings table for general company settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'العلماية للشحن',
  company_phone text DEFAULT '01012345678',
  company_email text DEFAULT 'support@company.com',
  company_address text DEFAULT '',
  company_city text DEFAULT 'القاهرة',
  company_governorate text DEFAULT 'القاهرة',
  currency text DEFAULT 'EGP',
  timezone text DEFAULT 'Africa/Cairo',
  notifications_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT true,
  whatsapp_enabled boolean DEFAULT true,
  auto_assign boolean DEFAULT true,
  maintenance_mode boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only head_manager can view settings
CREATE POLICY "Head managers can view settings"
  ON public.system_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'head_manager'::app_role));

-- Only head_manager can manage settings
CREATE POLICY "Head managers can manage settings"
  ON public.system_settings
  FOR ALL
  USING (has_role(auth.uid(), 'head_manager'::app_role));

-- Insert default settings row
INSERT INTO public.system_settings (company_name, company_phone, company_email)
VALUES ('العلماية للشحن', '01012345678', 'support@elalamia.com')
ON CONFLICT DO NOTHING;