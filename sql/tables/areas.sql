-- 1. إضافة عمود النوع لجدول المناطق (إذا لم يكن موجوداً)
ALTER TABLE areas 
ADD COLUMN IF NOT EXISTS area_type TEXT DEFAULT 'city' CHECK (area_type IN ('city', 'center', 'district', 'village'));

-- 2. إضافة عمود رابط للمحافظة (إذا لم يكن موجوداً)
ALTER TABLE areas 
ADD COLUMN IF NOT EXISTS governorate_id UUID REFERENCES governorates(id) ON DELETE CASCADE;

-- 3. إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_areas_governorate_id ON areas(governorate_id);
CREATE INDEX IF NOT EXISTS idx_areas_area_type ON areas(area_type);

-- 4. تحديث البيانات الحالية (اختياري - لتحويل المناطق الحالية إلى مدن افتراضية)
UPDATE areas 
SET area_type = 'city' 
WHERE area_type IS NULL;

-- 5. بيانات تجريبية للمحافظات الثلاث مع التقسيم الصحيح

-- أ. القاهرة (مدن رئيسية)
INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Downtown Cairo', 'وسط البلد', id, 'city', 95, 'active' FROM governorates WHERE name = 'القاهرة' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Zamalek', 'الزمالك', id, 'city', 98, 'active' FROM governorates WHERE name = 'القاهرة' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Maadi', 'المعادي', id, 'city', 96, 'active' FROM governorates WHERE name = 'القاهرة' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Nasr City', 'مدينة نصر', id, 'city', 94, 'active' FROM governorates WHERE name = 'القاهرة' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Heliopolis', 'هليوبوليس', id, 'city', 97, 'active' FROM governorates WHERE name = 'القاهرة' ON CONFLICT DO NOTHING;

-- أ. القاهرة (مراكز)
INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Shubra', 'شبرا', id, 'center', 85, 'active' FROM governorates WHERE name = 'القاهرة' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'El Marg', 'المرج', id, 'center', 82, 'active' FROM governorates WHERE name = 'القاهرة' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'El Salam', 'السلام', id, 'center', 80, 'active' FROM governorates WHERE name = 'القاهرة' ON CONFLICT DO NOTHING;

-- ب. القليوبية (مدن رئيسية)
INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Banha', 'بنها', id, 'city', 96, 'active' FROM governorates WHERE name = 'القليوبية' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Shubra El Kheima', 'شبرا الخيمة', id, 'city', 93, 'active' FROM governorates WHERE name = 'القليوبية' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Qalyub', 'قليوب', id, 'city', 90, 'active' FROM governorates WHERE name = 'القليوبية' ON CONFLICT DO NOTHING;

-- ب. القليوبية (مراكز)
INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Tukh', 'طوخ', id, 'center', 85, 'active' FROM governorates WHERE name = 'القليوبية' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Kafr Shukr', 'كفر شكر', id, 'center', 82, 'active' FROM governorates WHERE name = 'القليوبية' ON CONFLICT DO NOTHING;

-- ج. المنوفية (مدن رئيسية)
INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Shibin El Kom', 'شبين الكوم', id, 'city', 95, 'active' FROM governorates WHERE name = 'المنوفية' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Quesna', 'قويسنا', id, 'city', 92, 'active' FROM governorates WHERE name = 'المنوفية' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Menouf', 'منوف', id, 'city', 88, 'active' FROM governorates WHERE name = 'المنوفية' ON CONFLICT DO NOTHING;

-- ج. المنوفية (مراكز)
INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Berkat El Sab', 'بركة السبع', id, 'center', 84, 'active' FROM governorates WHERE name = 'المنوفية' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Tala', 'تلا', id, 'center', 80, 'active' FROM governorates WHERE name = 'المنوفية' ON CONFLICT DO NOTHING;

INSERT INTO areas (name, arabic_name, governorate_id, area_type, coverage_rate, status) 
SELECT 'Ashmoun', 'أشمون', id, 'center', 78, 'active' FROM governorates WHERE name = 'المنوفية' ON CONFLICT DO NOTHING;

-- 6. سياسات أمان إضافية
CREATE POLICY "Managers can manage areas by governorate" ON areas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager')
    )
  );