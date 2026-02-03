-- 1. إنشاء جدول طلبات البيك أب (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS public.pickup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id UUID REFERENCES public.shippers(id) ON DELETE CASCADE,
    delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    pickup_address TEXT NOT NULL,
    pickup_time TIMESTAMPTZ NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'collected', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء جدول الشيتات (Sheets) لمعالجة أخطاء الصفحات الأخرى
CREATE TABLE IF NOT EXISTS public.sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sheet_type TEXT NOT NULL, -- مثل 'pickup' أو 'courier' أو 'returned'
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active',
    file_url TEXT, -- إذا كنت ترفع ملفات إكسيل
    metadata JSONB, -- لتخزين أي بيانات إضافية
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تفعيل نظام الحماية (RLS) للجداول الجديدة
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

-- 4. إضافة سياسات الوصول (Policies) لتمكين المستخدمين المسجلين من التعامل مع الجداول
-- ملحوظة: هذه سياسات مفتوحة للمستخدمين المسجلين، يمكنك تضييقها لاحقاً حسب الأدوار
DO $$ 
BEGIN
    -- سياسات pickup_requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pickup_requests' AND policyname = 'authenticated_access') THEN
        CREATE POLICY authenticated_access ON public.pickup_requests FOR ALL TO authenticated USING (true);
    END IF;

    -- سياسات sheets
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sheets' AND policyname = 'authenticated_access_sheets') THEN
        CREATE POLICY authenticated_access_sheets ON public.sheets FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- 5. تحديث الـ Schema Cache (هذا يخبر Supabase أن الجداول الجديدة أصبحت متاحة)
NOTIFY pgrst, 'reload schema';