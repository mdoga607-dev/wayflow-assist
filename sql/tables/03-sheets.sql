-- 1. إنشاء الجدول من الصفر لضمان وجوده
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

-- 2. إضافة العمود في جدول الشحنات لو مش موجود
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipments' AND column_name='sheet_id') THEN
        ALTER TABLE public.shipments ADD COLUMN sheet_id UUID REFERENCES public.sheets(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. تفعيل الـ RLS (مهم جداً للـ Cache)
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

-- 4. سياسة وصول تسمح للكل (عشان نتخطى أي تعقيد حالياً)
DROP POLICY IF EXISTS "public_sheets_access" ON public.sheets;
CREATE POLICY "public_sheets_access" ON public.sheets FOR ALL USING (true) WITH CHECK (true);

-- 5. إضافة بيانات وهمية فوراً عشان تختبر
INSERT INTO public.sheets (name, sheet_type) VALUES ('شيت تجريبي لاختبار النظام', 'courier');