-- 1. إنشاء جدول المستخدمين (profiles) - ضروري للربط مع المصادقة
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('head_manager', 'manager', 'courier', 'shipper', 'user', 'guest')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger لتحديث updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. إنشاء جدول المناديب (كما في الحل السابق)
CREATE TABLE IF NOT EXISTS delegates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL DEFAULT 'القاهرة',
  branch TEXT DEFAULT 'بدون فرع',
  avatar_url TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'busy')),
  total_delivered INTEGER DEFAULT 0,
  total_delayed INTEGER DEFAULT 0,
  total_returned INTEGER DEFAULT 0,
  balance NUMERIC(10, 2) DEFAULT 0.00,
  commission_due NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_delegates_updated_at
  BEFORE UPDATE ON delegates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. إنشاء جدول الشحنات (كما في الحل السابق)
CREATE TABLE IF NOT EXISTS shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_city TEXT NOT NULL DEFAULT 'القاهرة',
  recipient_area TEXT DEFAULT NULL,
  cod_amount NUMERIC(10, 2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'transit', 'delivered', 'delayed', 'returned')),
  delegate_id UUID REFERENCES delegates(id) ON DELETE SET NULL,
  notes TEXT DEFAULT NULL,
  return_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. إنشاء دالة لإنشاء ملف تعريف تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email LIKE '%admin%' THEN 'head_manager'
      WHEN NEW.email LIKE '%manager%' THEN 'manager'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger لإنشاء ملف تعريف عند تسجيل مستخدم جديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. سياسات RLS لجدول المناديب (متوافقة مع جدول profiles)
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

-- السماح للمناديب برؤية بياناتهم فقط (بناءً على تطابق الهاتف)
CREATE POLICY "Delegates can view own data" ON delegates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'courier'
      AND delegates.phone = profiles.phone
    )
  );

-- 9. سياسات RLS لجدول الشحنات
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view shipments" ON shipments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Managers can insert shipments" ON shipments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('head_manager', 'manager', 'shipper')
    )
  );

-- 10. فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_delegates_status ON delegates(status);
CREATE INDEX IF NOT EXISTS idx_delegates_phone ON delegates(phone);
CREATE INDEX IF NOT EXISTS idx_shipments_delegate_id ON shipments(delegate_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- 11. بيانات تجريبية (للاختبار السريع)
-- إنشاء مستخدم تجريبي (سيتم إنشاء ملفه تلقائياً بواسطة الـ trigger)
-- ملاحظة: قم بإنشاء مستخدم عبر واجهة Supabase Auth أولاً

-- تحديث ملف تعريف المستخدم التجريبي ليكون مدير
-- (استبدل 'user-id-here' بمعرف المستخدم الفعلي من جدول auth.users)
-- UPDATE profiles SET role = 'head_manager', phone = '01012345678' WHERE id = 'user-id-here';

-- إضافة مناديب تجريبيين
INSERT INTO delegates (name, phone, city, branch, status, total_delivered, total_delayed, total_returned, balance, commission_due) VALUES
('محمد أحمد', '01012345678', 'القاهرة', 'فرع المعادي', 'active', 156, 12, 8, 2450.75, 350.00),
('أحمد سعيد', '01123456789', 'الجيزة', 'فرع المهندسين', 'active', 189, 8, 5, 3120.50, 420.00),
('مصطفى علي', '01234567890', 'الإسكندرية', 'فرع سموحة', 'active', 142, 15, 10, 2180.25, 290.00),
('خالد محمد', '01543210987', 'المنصورة', 'بدون فرع', 'on_leave', 98, 22, 18, 1450.00, 180.00),
('إسلام حسن', '01098765432', 'شبين الكوم', 'فرع وسط البلد', 'busy', 210, 5, 3, 3580.00, 480.00);