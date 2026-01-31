-- 1. تفعيل الامتداد المطلوب (مهم جداً لـ UUID)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. إنشاء جدول المناطق (الكود الصحيح 100%)
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

-- 3. تفعيل سياسات الأمان
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- 4. سياسة الوصول الأساسية
CREATE POLICY "Enable read access for authenticated users" 
  ON public.areas FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 5. فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_areas_governorate ON public.areas(governorate);
CREATE INDEX IF NOT EXISTS idx_areas_city ON public.areas(city);
CREATE INDEX IF NOT EXISTS idx_areas_status ON public.areas(status);

-- 6. بيانات تجريبية
INSERT INTO public.areas (name, governorate, city, coverage_percentage, status, key_words) 
VALUES 
  ('القاهرة - وسط', 'القاهرة', 'القاهرة', 95, 'active', ARRAY['التحرير', 'وسط البلد', 'العتبة']),
  ('الرياض - الشمال', 'الرياض', 'الرياض', 92, 'active', ARRAY['العليا', 'النخيل', 'الروضة']),
  ('جدة - المركز', 'مكة', 'جدة', 98, 'active', ARRAY['البلد', 'الرويس', 'الزهور'])
ON CONFLICT (name) DO NOTHING;

-- 7. إعادة تحميل الـ schema cache (مهم جداً!)
NOTIFY pgrst, 'reload schema';

-- 8. التحقق من النجاح
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'areas'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ تم إنشاء جدول areas بنجاح!';
    RAISE NOTICE '✅ الجدول جاهز للاستخدام في التطبيق';
  ELSE
    RAISE EXCEPTION '❌ فشل إنشاء الجدول - تحقق من الأخطاء أعلاه';
  END IF;
END $$;