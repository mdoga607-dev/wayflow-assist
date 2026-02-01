-- ========================================
-- Supabase Database Setup - النظام الكامل
-- ========================================
-- الإعدادات الأولية
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========================================
-- 1. إنشاء نوع الرتب (يجب أن يكون أولاً)
-- ========================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'head_manager', 'manager', 'courier', 'shipper', 'user', 'guest'
    );
  END IF;
END $$;

-- ========================================
-- 2. الجداول الأساسية (مرتبة حسب التبعيات)
-- ========================================

-- الجدول 1: الملفات الشخصية
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- الجدول 2: رتب المستخدمين
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- الجدول 3: المتاجر/الفروع
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  phone TEXT,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_casual BOOLEAN DEFAULT false,
  central_branch BOOLEAN DEFAULT false,
  operating_days JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الجدول 4: التجار
CREATE TABLE IF NOT EXISTS public.shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  branch TEXT,
  logo_url TEXT,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  total_shipments INTEGER DEFAULT 0,
  active_shipments INTEGER DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- الجدول 5: المناديب
CREATE TABLE IF NOT EXISTS public.delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  branch TEXT,
  city TEXT NOT NULL,
  avatar_url TEXT,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  total_delivered INTEGER DEFAULT 0,
  total_delayed INTEGER DEFAULT 0,
  total_returned INTEGER DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  commission_due DECIMAL(12,2) DEFAULT 0,
  courier_limit INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- الجدول 6: المناطق
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  coverage_percentage INTEGER DEFAULT 0 CHECK (coverage_percentage BETWEEN 0 AND 100),
  courier_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'under_development', 'inactive')),
  key_words TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الجدول 7: الشيتات
CREATE TABLE IF NOT EXISTS public.sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sheet_type TEXT NOT NULL CHECK (sheet_type IN ('courier', 'returned', 'pickup', 'travel', 'returned_travel')),
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- الجدول 8: الشحنات
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
  sheet_id UUID REFERENCES public.sheets(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_city TEXT NOT NULL,
  recipient_area TEXT,
  product_name TEXT,
  cod_amount DECIMAL(12,2) DEFAULT 0 CHECK (cod_amount >= 0),
  shipping_fee DECIMAL(12,2) DEFAULT 0 CHECK (shipping_fee >= 0),
  weight DECIMAL(8,2),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'transit', 'out_for_delivery', 'delivered', 'delayed', 'returned', 'cancelled', 'partial_return')),
  return_reason TEXT,
  pickup_requested BOOLEAN DEFAULT false,
  pickup_address TEXT,
  pickup_time TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- الجدول 9: الشكاوى
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  complainant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  complaint_type TEXT NOT NULL CHECK (complaint_type IN ('delivery', 'accounts', 'returns', 'courier_performance', 'other')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'on_hold', 'finished', 'compensated')),
  compensation_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- الجدول 10: المهام
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- الجدول 11: العمليات المالية
CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'collection', 'refund', 'expense', 'transfer')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'wallet', 'credit')),
  reference_number TEXT,
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الجدول 12: حملات الواتساب
CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('marketing', 'reminder', 'notification', 'survey')),
  message_template TEXT NOT NULL,
  recipient_list TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الجدول 13: قوالب الواتساب
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[],
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الجدول 14: الروبوتات (Chat Bots)
CREATE TABLE IF NOT EXISTS public.whatsapp_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_keywords TEXT[],
  response_message TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  conversation_count INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الجدول 15: سجلات الجرد
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  item_count INTEGER NOT NULL,
  discrepancy_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الجدول 16: إعدادات الفروع (أوقات العمل)
CREATE TABLE IF NOT EXISTS public.branch_timings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (store_id, day_of_week)
);

-- ========================================
-- 3. تفعيل سياسات الأمان (RLS) لجميع الجداول
-- ========================================
DO $$ 
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'profiles', 'user_roles', 'stores', 'shippers', 'delegates', 'areas',
        'sheets', 'shipments', 'complaints', 'tasks', 'balance_transactions',
        'whatsapp_campaigns', 'whatsapp_templates', 'whatsapp_bots',
        'inventory_logs', 'branch_timings'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;

-- سياسات الوصول الأساسية
CREATE POLICY "Enable read access for authenticated users" 
  ON public.profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" 
  ON public.user_roles FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" 
  ON public.user_roles FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for managers" 
  ON public.stores FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable insert for managers" 
  ON public.stores FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable read access for managers" 
  ON public.shippers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable insert for managers" 
  ON public.shippers FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable read access for managers" 
  ON public.delegates FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable insert for managers" 
  ON public.delegates FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable read access for managers" 
  ON public.areas FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable insert for managers" 
  ON public.areas FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable read access for managers" 
  ON public.sheets FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable insert for managers" 
  ON public.sheets FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Enable read access for managers" 
  ON public.shipments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager', 'courier')
    )
  );

CREATE POLICY "Enable insert for managers" 
  ON public.shipments FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

-- ========================================
-- 4. الفهارس لتحسين الأداء
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_delegate ON public.shipments(delegate_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_created ON public.shipments(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_area ON public.shipments(area_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delegates_status ON public.delegates(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delegates_store ON public.delegates(store_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delegates_phone ON public.delegates(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_areas_governorate ON public.areas(governorate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_areas_city ON public.areas(city);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_balance_transactions_date ON public.balance_transactions(transaction_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sheets_type ON public.sheets(sheet_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sheets_delegate ON public.sheets(delegate_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sheets_status ON public.sheets(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shippers_phone ON public.shippers(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shippers_status ON public.shippers(status);

-- ========================================
-- 5. Trigger لتحديث التاريخ تلقائياً
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ Trigger على الجداول المناسبة
DO $$ 
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'profiles', 'shippers', 'delegates', 'stores', 'areas', 'sheets',
        'shipments', 'balance_transactions', 'whatsapp_templates', 'whatsapp_bots',
        'inventory_logs', 'branch_timings', 'complaints', 'tasks', 
        'whatsapp_campaigns', 'user_roles'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
             CREATE TRIGGER update_%I_updated_at
             BEFORE UPDATE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
            table_name, table_name, table_name, table_name
        );
    END LOOP;
END $$;

-- ========================================
-- 6. Trigger لإنشاء الملف الشخصي تلقائياً عند التسجيل
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'مستخدم جديد')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 7. بيانات تجريبية مضمونة 100% (للاختبار)
-- ========================================

-- إدخال متاجر تجريبية
INSERT INTO public.stores (name, address, city, phone, central_branch, status) 
VALUES 
  ('فرع القاهرة', 'حي السفارات', 'القاهرة', '0221234567', true, 'active'),
  ('فرع جدة', 'البلد', 'جدة', '01221234567', true, 'active'),
  ('فرع الدمام', 'الخبر', 'الدمام', '01321234567', true, 'active')
ON CONFLICT (name) DO NOTHING;

-- إدخال مناديب تجريبيين
INSERT INTO public.delegates (name, phone, branch, city, status, total_delivered, total_delayed, total_returned, courier_limit) 
VALUES 
  ('أحمد محمد', '01111111111', 'القاهرة', 'القاهرة', 'active', 120, 5, 3, 30),
  ('خالد عبدالله', '01122222222', 'جدة', 'جدة', 'active', 95, 8, 2, 25),
  ('محمد سعيد', '01133333333', 'الدمام', 'الدمام', 'active', 87, 12, 5, 20)
ON CONFLICT (phone) DO UPDATE SET status = 'active';

-- إدخال تجار تجريبيين
INSERT INTO public.shippers (name, phone, email, address, city, branch, status, total_shipments, active_shipments, balance) 
VALUES 
  ('شركة النور للتجارة', '01222222222', 'nor@example.com', 'حي السفارات', 'القاهرة', 'القاهرة', 'active', 150, 25, 5000.00),
  ('متجر الفخر الإلكتروني', '01233333333', 'fakhr@example.com', 'البلد', 'جدة', 'جدة', 'active', 120, 18, 3500.00),
  ('محلات السعادة العامة', '01244444444', 'saada@example.com', 'الخبر', 'الدمام', 'الدمام', 'active', 95, 12, 2800.00)
ON CONFLICT (phone) DO UPDATE SET status = 'active';

-- إدخال شيتات تجريبية
INSERT INTO public.sheets (name, sheet_type, delegate_id, store_id, status)
SELECT 
  'شيت مناديب - ' || CURRENT_DATE,
  'courier',
  d.id,
  s.id,
  'active'
FROM public.delegates d
CROSS JOIN public.stores s
WHERE d.name = 'أحمد محمد' AND s.name = 'فرع القاهرة'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.sheets (name, sheet_type, delegate_id, store_id, status)
SELECT 
  'شيت بيك أب - ' || CURRENT_DATE,
  'pickup',
  d.id,
  s.id,
  'active'
FROM public.delegates d
CROSS JOIN public.stores s
WHERE d.name = 'خالد عبدالله' AND s.name = 'فرع جدة'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.sheets (name, sheet_type, delegate_id, store_id, status)
SELECT 
  'شيت مرتجعات - ' || CURRENT_DATE,
  'returned',
  d.id,
  s.id,
  'active'
FROM public.delegates d
CROSS JOIN public.stores s
WHERE d.name = 'محمد سعيد' AND s.name = 'فرع الدمام'
LIMIT 1
ON CONFLICT DO NOTHING;

-- إدخال شحنات تجريبية
INSERT INTO public.shipments (
  tracking_number, recipient_name, recipient_phone, recipient_address, 
  recipient_city, status, cod_amount, sheet_id, delegate_id, store_id, shipper_id
)
SELECT 
  'TEST-' || LPAD(gs::text, 6, '0'),
  'عميل تجريبي ' || gs,
  '010' || LPAD((1000000 + gs)::text, 7, '0'),
  'شارع التحرير ' || gs,
  'القاهرة',
  'pending',
  (50 + gs * 10)::decimal,
  sh.id,
  d.id,
  s.id,
  sp.id
FROM public.sheets sh
CROSS JOIN public.delegates d
CROSS JOIN public.stores s
CROSS JOIN public.shippers sp
CROSS JOIN generate_series(1, 5) gs
WHERE sh.sheet_type = 'courier'
  AND d.name = 'أحمد محمد'
  AND s.name = 'فرع القاهرة'
  AND sp.name = 'شركة النور للتجارة'
LIMIT 25
ON CONFLICT DO NOTHING;

-- ========================================
-- 8. التحقق من النجاح
-- ========================================
DO $$
DECLARE
  store_count INTEGER;
  delegate_count INTEGER;
  shipper_count INTEGER;
  sheet_count INTEGER;
  shipment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO store_count FROM public.stores;
  SELECT COUNT(*) INTO delegate_count FROM public.delegates;
  SELECT COUNT(*) INTO shipper_count FROM public.shippers;
  SELECT COUNT(*) INTO sheet_count FROM public.sheets;
  SELECT COUNT(*) INTO shipment_count FROM public.shipments;
  
  RAISE NOTICE '✅ تم إنشاء % متاجر بنجاح', store_count;
  RAISE NOTICE '✅ تم إنشاء % مناديب بنجاح', delegate_count;
  RAISE NOTICE '✅ تم إنشاء % تجار بنجاح', shipper_count;
  RAISE NOTICE '✅ تم إنشاء % شيتات بنجاح', sheet_count;
  RAISE NOTICE '✅ تم إنشاء % شحنة بنجاح', shipment_count;
  RAISE NOTICE '✅ النظام جاهز للاستخدام الكامل';
  
  IF store_count > 0 AND delegate_count > 0 AND shipper_count > 0 AND sheet_count > 0 AND shipment_count > 0 THEN
    RAISE NOTICE '🎉 جميع الجداول تحتوي على بيانات تجريبية!';
  ELSE
    RAISE WARNING '⚠️ بعض الجداول قد تكون فارغة. يرجى التحقق من البيانات.';
  END IF;
END $$;