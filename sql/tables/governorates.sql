-- 1. إنشاء جدول المحافظات الصحيح
CREATE TABLE IF NOT EXISTS governorates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                    -- الاسم العربي (مطلوب)
  name_en TEXT,                          -- الاسم الإنجليزي
  code TEXT UNIQUE,                      -- كود المحافظة (3 أحرف)
  shipping_fee NUMERIC(10, 2) DEFAULT 30.00, -- رسوم الشحن
  delivery_days INTEGER DEFAULT 2,       -- أيام التوصيل
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_governorates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_governorates_updated_at
  BEFORE UPDATE ON governorates
  FOR EACH ROW
  EXECUTE FUNCTION update_governorates_updated_at();

-- 3. سياسات RLS
ALTER TABLE governorates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view governorates" ON governorates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Managers can insert governorates" ON governorates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Managers can update governorates" ON governorates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager')
    )
  );

-- 4. بيانات تجريبية للمحافظات المصرية (3 محافظات رئيسية)
INSERT INTO governorates (name, name_en, code, shipping_fee, delivery_days, status) VALUES
('القاهرة', 'Cairo', 'CAI', 30.00, 2, 'active'),
('القليوبية', 'Qalyubia', 'QAL', 25.00, 2, 'active'),
('المنوفية', 'Monufia', 'MON', 20.00, 3, 'active')
ON CONFLICT (name) DO NOTHING;