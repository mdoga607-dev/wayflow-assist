-- 1. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    city TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sheet_type TEXT NOT NULL,
    delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. تحديث جدول الشحنات لربطه بالشيت بشكل صحيح
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS sheet_id UUID REFERENCES public.sheets(id) ON DELETE SET NULL;

-- 3. تفعيل الحماية RLS لجميع الجداول
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- 4. سياسات الوصول الشاملة (للمستخدمين المسجلين فقط لضمان الأمان)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Access All" ON public.sheets;
    CREATE POLICY "Access All" ON public.sheets FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Access All" ON public.shipments;
    CREATE POLICY "Access All" ON public.shipments FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Access All" ON public.delegates;
    CREATE POLICY "Access All" ON public.delegates FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Access All" ON public.stores;
    CREATE POLICY "Access All" ON public.stores FOR ALL TO authenticated USING (true);
END $$;