-- إنشاء جدول المعاملات المالية
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'check', 'online')),
  notes TEXT,
  user_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  receipt_url TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'إيداع رواتب', 
    'إيداع تجار', 
    'تحصيل شحنات', 
    'رواتب مناديب', 
    'مصاريف تشغيلية', 
    'مصاريف ثابتة', 
    'مصاريف صيانة'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- سياسات أمان RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- السماح للمديرين بالقراءة والكتابة
CREATE POLICY "Managers can manage transactions" ON transactions
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

-- إدخال بيانات تجريبية مصرية
INSERT INTO transactions (date, amount, type, method, notes, user_name, status, category) VALUES
('2024-01-15', 15000.00, 'credit', 'bank_transfer', 'إيداع راتب يناير من شركة النقل السريع', 'أحمد محمد', 'completed', 'إيداع رواتب'),
('2024-01-14', 3500.00, 'debit', 'cash', 'دفعة للمندوب خالد سعيد عن شحنات يناير', 'خالد سعيد', 'completed', 'رواتب مناديب'),
('2024-01-14', 8750.00, 'credit', 'cash', 'تحصيل شحنات من تاجر محمد علي فرع المعادي', 'محمد علي', 'completed', 'تحصيل شحنات'),
('2024-01-13', 1200.00, 'debit', 'bank_transfer', 'مصاريف كهرباء ومياه لمكتب الشركة', 'إدارة', 'completed', 'مصاريف تشغيلية'),
('2024-01-12', 6500.00, 'credit', 'check', 'تحصيل شحنات من تاجر سارة محمد فرع المهندسين', 'سارة محمد', 'completed', 'تحصيل شحنات'),
('2024-01-12', 4200.00, 'debit', 'cash', 'شراء مواد تعبئة وتغليف للشحنات', 'إدارة', 'completed', 'مصاريف تشغيلية'),
('2024-01-11', 9800.00, 'credit', 'bank_transfer', 'إيداع من تاجر أحمد حسن فرع مدينة نصر', 'أحمد حسن', 'completed', 'إيداع تجار'),
('2024-01-10', 2800.00, 'debit', 'bank_transfer', 'دفع إيجار مكتب الشركة لشهر يناير', 'إدارة', 'completed', 'مصاريف ثابتة'),
('2024-01-09', 5300.00, 'credit', 'cash', 'تحصيل شحنات من تاجر فاطمة علي فرع شبرا', 'فاطمة علي', 'pending', 'تحصيل شحنات'),
('2024-01-08', 1850.00, 'debit', 'cash', 'صيانة سيارات التوصيل', 'إدارة', 'completed', 'مصاريف صيانة'),
('2024-01-07', 7200.00, 'credit', 'bank_transfer', 'إيداع من تاجر إسلام حسن فرع الزقازيق', 'إسلام حسن', 'completed', 'إيداع تجار'),
('2024-01-06', 3100.00, 'debit', 'bank_transfer', 'دفع فاتورة إنترنت واتصالات', 'إدارة', 'completed', 'مصاريف تشغيلية'),
('2024-01-05', 4800.00, 'credit', 'check', 'تحصيل شحنات من تاجر عمرو عبد الرحمن فرع طنطا', 'عمرو عبد الرحمن', 'completed', 'تحصيل شحنات'),
('2024-01-04', 2200.00, 'debit', 'cash', 'شراء وقود للسيارات', 'إدارة', 'completed', 'مصاريف تشغيلية'),
('2024-01-03', 11500.00, 'credit', 'bank_transfer', 'إيداع راتب ديسمبر من شركة النقل السريع', 'أحمد محمد', 'completed', 'إيداع رواتب')
ON CONFLICT DO NOTHING;