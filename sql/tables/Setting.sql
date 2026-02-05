-- إنشاء جدول إعدادات النظام
CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL DEFAULT 'أمان للشحن',
    company_phone text DEFAULT '201000000000',
    company_email text DEFAULT 'support@amanshipping.com',
    company_address text DEFAULT 'شارع التسعين، المعادي الجديدة',
    company_city text DEFAULT 'القاهرة',
    company_governorate text DEFAULT 'القاهرة',
    currency text DEFAULT 'EGP',
    timezone text DEFAULT 'Africa/Cairo',
    notifications_enabled boolean DEFAULT true,
    sms_enabled boolean DEFAULT true,
    whatsapp_enabled boolean DEFAULT true,
    auto_assign boolean DEFAULT true,
    maintenance_mode boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_settings
CREATE POLICY "Head managers can view settings" 
ON public.system_settings FOR SELECT 
USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Head managers can manage settings" 
ON public.system_settings FOR ALL 
USING (has_role(auth.uid(), 'head_manager'));

-- إنشاء جدول حملات الواتساب
CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL DEFAULT 'marketing',
    message text NOT NULL,
    recipients text[],
    messages_count integer DEFAULT 0,
    status text DEFAULT 'draft',
    scheduled_at timestamptz,
    completed_at timestamptz,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_campaigns
CREATE POLICY "Managers can view campaigns" 
ON public.whatsapp_campaigns FOR SELECT 
USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Managers can manage campaigns" 
ON public.whatsapp_campaigns FOR ALL 
USING (has_role(auth.uid(), 'head_manager'));

-- إنشاء جدول روبوتات الواتساب
CREATE TABLE IF NOT EXISTS public.whatsapp_bots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status text DEFAULT 'inactive',
    conversations_count integer DEFAULT 0,
    response_rate numeric(5,2) DEFAULT 0,
    last_active timestamptz,
    config jsonb,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_bots ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_bots
CREATE POLICY "Managers can view bots" 
ON public.whatsapp_bots FOR SELECT 
USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Managers can manage bots" 
ON public.whatsapp_bots FOR ALL 
USING (has_role(auth.uid(), 'head_manager'));

-- إنشاء جدول قوالب الواتساب
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text NOT NULL DEFAULT 'general',
    content text NOT NULL,
    usage_count integer DEFAULT 0,
    last_used timestamptz,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_templates
CREATE POLICY "Managers can view templates" 
ON public.whatsapp_templates FOR SELECT 
USING (has_role(auth.uid(), 'head_manager'));

CREATE POLICY "Managers can manage templates" 
ON public.whatsapp_templates FOR ALL 
USING (has_role(auth.uid(), 'head_manager'));

-- إضافة أعمدة مفقودة لجدول المناديب
ALTER TABLE public.delegates 
ADD COLUMN IF NOT EXISTS current_location text,
ADD COLUMN IF NOT EXISTS last_location_update timestamptz,
ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- إنشاء دوال التقارير
CREATE OR REPLACE FUNCTION public.get_reports_stats(
    date_from date DEFAULT NULL,
    date_to date DEFAULT NULL
)
RETURNS TABLE(
    total_revenue numeric,
    total_commissions numeric,
    total_shipments bigint,
    delivered_count bigint,
    pending_count bigint,
    delayed_count bigint,
    returned_count bigint,
    transit_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN s.status = 'delivered' THEN s.cod_amount ELSE 0 END), 0)::numeric as total_revenue,
        COALESCE(SUM(d.commission_due), 0)::numeric as total_commissions,
        COUNT(s.id)::bigint as total_shipments,
        COUNT(CASE WHEN s.status = 'delivered' THEN 1 END)::bigint as delivered_count,
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END)::bigint as pending_count,
        COUNT(CASE WHEN s.status = 'delayed' THEN 1 END)::bigint as delayed_count,
        COUNT(CASE WHEN s.status = 'returned' THEN 1 END)::bigint as returned_count,
        COUNT(CASE WHEN s.status = 'in_transit' THEN 1 END)::bigint as transit_count
    FROM public.shipments s
    LEFT JOIN public.delegates d ON s.delegate_id = d.id
    WHERE (date_from IS NULL OR s.created_at::date >= date_from)
    AND (date_to IS NULL OR s.created_at::date <= date_to);
END;
$$;

-- دالة التقارير الشهرية
CREATE OR REPLACE FUNCTION public.get_monthly_reports(
    date_from date DEFAULT NULL,
    date_to date DEFAULT NULL
)
RETURNS TABLE(
    month_year date,
    total_revenue numeric,
    total_commissions numeric,
    total_shipments bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('month', s.created_at)::date as month_year,
        COALESCE(SUM(CASE WHEN s.status = 'delivered' THEN s.cod_amount ELSE 0 END), 0)::numeric as total_revenue,
        COALESCE(SUM(CASE WHEN s.status = 'delivered' THEN 5 ELSE 0 END), 0)::numeric as total_commissions,
        COUNT(s.id)::bigint as total_shipments
    FROM public.shipments s
    WHERE (date_from IS NULL OR s.created_at::date >= date_from)
    AND (date_to IS NULL OR s.created_at::date <= date_to)
    GROUP BY DATE_TRUNC('month', s.created_at)
    ORDER BY month_year DESC
    LIMIT 12;
END;
$$;

-- دالة تقارير المناديب
CREATE OR REPLACE FUNCTION public.get_delegate_reports(
    date_from date DEFAULT NULL,
    date_to date DEFAULT NULL
)
RETURNS TABLE(
    delegate_id uuid,
    delegate_name text,
    total_delivered bigint,
    total_delayed bigint,
    total_returned bigint,
    success_rate numeric,
    commission_due numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as delegate_id,
        d.name as delegate_name,
        d.total_delivered::bigint,
        d.total_delayed::bigint,
        d.total_returned::bigint,
        CASE 
            WHEN (d.total_delivered + d.total_delayed + d.total_returned) > 0 
            THEN (d.total_delivered::numeric / (d.total_delivered + d.total_delayed + d.total_returned)::numeric)
            ELSE 0
        END as success_rate,
        d.commission_due
    FROM public.delegates d
    ORDER BY d.total_delivered DESC;
END;
$$;