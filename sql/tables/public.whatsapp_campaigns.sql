ALTER TABLE public.whatsapp_campaigns 
ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.whatsapp_bots
ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.whatsapp_templates
ENABLE ROW LEVEL SECURITY;
-- RLS policies for whatsapp_templates
CREATE POLICY "Managers can view templates" 
ON public.whatsapp_templates FOR SELECT
USING (has_role(auth.uid(), 'head_manager'));
CREATE POLICY "Managers can manage templates"
ON public.whatsapp_templates FOR ALL
USING (has_role(auth.uid(), 'head_manager'));
-- إنشاء جدول حملات الواتساب
CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    bot_id uuid REFERENCES public.whatsapp_bots(id),
    template_id uuid REFERENCES public.whatsapp_templates(id),
    target_audience jsonb,
    scheduled_time timestamptz,
    status text DEFAULT 'scheduled',
    sent_count integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    read_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
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
    id uuid PRIMARY KEY DEFAULT
    gen_random_uuid(),
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