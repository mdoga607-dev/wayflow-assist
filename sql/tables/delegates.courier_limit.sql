-- 1. إنشاء جدول المناديب (الهيكل المصري الصحيح)
CREATE TABLE delegates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL DEFAULT 'القاهرة',
    branch TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'busy', 'on_leave')),
    total_delivered INTEGER DEFAULT 0,
    total_delayed INTEGER DEFAULT 0,
    total_returned INTEGER DEFAULT 0,
    balance NUMERIC(10, 2) DEFAULT 0.00,
    commission_due NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- 2. إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. إنشاء Trigger لتحديث updated_at
CREATE TRIGGER update_delegates_updated_at
  BEFORE UPDATE ON delegates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. إنشاء سياسات RLS (Row Level Security)
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;

-- السماح للمديرين برؤية وتعديل كل المناديب
CREATE POLICY "Managers can view all delegates" ON delegates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Managers can insert delegates" ON delegates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager')
    )
  );

CREATE POLICY "Managers can update delegates" ON delegates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager')
    )
  );

-- السماح للمناديب برؤية بياناتهم فقط
CREATE POLICY "Delegates can view their own data" ON delegates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'delegate'
      AND delegates.id = profiles.delegate_id
    )
  );

-- 5. إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_delegates_status ON delegates(status);
CREATE INDEX idx_delegates_city ON delegates(city);
CREATE INDEX idx_delegates_created_at ON delegates(created_at DESC);

-- 6. بيانات تجريبية مصرية (للاختبار السريع)
INSERT INTO delegates (name, phone, city, branch, status, total_delivered, total_delayed, total_returned, balance, commission_due) VALUES
('محمد أحمد', '01012345678', 'القاهرة', 'فرع المعادي', 'active', 156, 12, 8, 2450.75, 350.00),
('أحمد سعيد', '01123456789', 'الجيزة', 'فرع المهندسين', 'active', 189, 8, 5, 3120.50, 420.00),
('مصطفى علي', '01234567890', 'الإسكندرية', 'فرع سموحة', 'active', 142, 15, 10, 2180.25, 290.00),
('خالد محمد', '01543210987', 'المنصورة', 'بدون فرع', 'on_leave', 98, 22, 18, 1450.00, 180.00),
('إسلام حسن', '01098765432', 'شبين الكوم', 'فرع وسط البلد', 'busy', 210, 5, 3, 3580.00, 480.00),
('عمرو عبد الرحمن', '01187654321', 'طنطا', 'فرع طنطا', 'inactive', 45, 30, 25, 680.50, 90.00),
('ياسر محمد', '01276543210', 'الإسماعيلية', 'فرع الإسماعيلية', 'active', 167, 9, 6, 2680.75, 360.00),
('هاني سمير', '01565432109', 'السويس', 'فرع السويس', 'active', 134, 18, 12, 2050.25, 275.00),
('وائل فتحي', '01065432109', 'دمياط', 'بدون فرع', 'active', 112, 25, 20, 1780.00, 240.00),
('شريف عبد الحميد', '01154321098', 'الزقازيق', 'فرع الزقازيق', 'active', 178, 7, 4, 2950.50, 395.00);