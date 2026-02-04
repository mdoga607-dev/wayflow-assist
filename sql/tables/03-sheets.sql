-- 1. إنشاء الجدول من الصفر لضمان وجوده
CREATE TABLE IF NOT EXISTS public.sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sheet_type TEXT NOT NULL, -- مثل 'pickup' أو 'courier' أو 'returned'
    delegate_id UUID REFERENCES public.delegates(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. تفعيل نظام الحماية (RLS) للجدول الجديد
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
-- 3. إضافة سياسة وصول شاملة (للمستخدمين المسجلين فقط لضمان الأمان)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Access All" ON public.sheets;
    CREATE POLICY "Access All" ON public.sheets FOR ALL TO authenticated USING (true);
END $$;
-- 4. تحديث الـ Schema Cache (هذا يخبر Supabase أن الجدول الجديد أصبح متاحاً)
NOTIFY pgrst, 'reload schema';
-- 5. إضافة عمود sheet_id إلى جدول الشحنات إذا لم يكن موجوداً
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS sheet_id UUID REFERENCES public.sheets(id) ON DELETE SET NULL;
-- 6. تحديث سياسة الوصول لجدول الشحنات للسماح بالوصول إلى عمود sheet_id
DO $$
BEGIN
    DROP POLICY IF EXISTS "Access All" ON public.shipments;
    CREATE POLICY "Access All" ON public.shipments FOR ALL TO authenticated USING (true);
END $$;
-- 7. تحديث الـ Schema Cache مرة أخرى بعد تعديل جدول الشحنات
NOTIFY pgrst, 'reload schema';
