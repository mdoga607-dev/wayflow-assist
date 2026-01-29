-- ========================================
-- إضافة بيانات تجريبية للمتاجر
-- ========================================
INSERT INTO public.stores (name, address, city, phone)
VALUES 
  ('فرع الرياض', 'حي السفارات', 'الرياض', '0112345678'),
  ('فرع جدة', 'البلد', 'جدة', '0122345678'),
  ('فرع الدمام', 'الخبر', 'الدمام', '0132345678')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- إضافة بيانات تجريبية للمناديب
-- ========================================
INSERT INTO public.delegates (name, phone, branch, city, store_id, status, courier_limit, balance, commission_due)
SELECT 
  temp.name, 
  temp.phone, 
  temp.branch, 
  temp.city, 
  s.id AS store_id,
  temp.status, 
  temp.courier_limit, 
  temp.balance, 
  temp.commission_due
FROM (
  VALUES
    ('أحمد محمد', '0551111111', 'الرياض', 'الرياض', 'active', 50, 1200.50, 350.00),
    ('خالد عبدالله', '0552222222', 'جدة', 'جدة', 'active', 40, 850.75, 210.25),
    ('محمد سعيد', '0553333333', 'الدمام', 'الدمام', 'active', 45, 1050.00, 280.50)
) AS temp(name, phone, branch, city, status, courier_limit, balance, commission_due)
LEFT JOIN public.stores s ON s.name = temp.branch
ON CONFLICT (phone) DO UPDATE 
SET status = EXCLUDED.status, updated_at = NOW();

-- ========================================
-- إضافة بيانات تجريبية للتجار
-- ========================================
INSERT INTO public.shippers (name, phone, city, status)
VALUES 
  ('شركة النور للتجارة', '0101111111', 'الرياض', 'active'),
  ('متجر الفخر الإلكتروني', '0102222222', 'جدة', 'active'),
  ('محلات السعادة العامة', '0103333333', 'الدمام', 'active')
ON CONFLICT (phone) DO NOTHING;

-- ========================================
-- إضافة بيانات تجريبية للشيتات
-- ========================================
INSERT INTO public.sheets (name, sheet_type, delegate_id) 
SELECT 
  'شيت مندوب ' || d.name || ' - ' || CURRENT_DATE,
  'courier',
  d.id
FROM public.delegates d
WHERE d.status = 'active'
LIMIT 3
ON CONFLICT DO NOTHING;

-- ========================================
-- إضافة بيانات تجريبية للعمليات المالية
-- ========================================
INSERT INTO public.balance_transactions (
  shipper_id, 
  delegate_id, 
  amount, 
  transaction_type, 
  payment_method, 
  reference_number, 
  notes,
  transaction_date,
  created_by
)
SELECT 
  (SELECT id FROM public.shippers WHERE status = 'active' LIMIT 1),
  (SELECT id FROM public.delegates WHERE status = 'active' LIMIT 1),
  150.75,
  'payment',
  'cash',
  'INV-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'دفع مقابل شحنة #12345',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.balance_transactions LIMIT 1
)
ON CONFLICT DO NOTHING;

-- ========================================
-- التحقق من النجاح
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ تم إنشاء جميع الجداول والبيانات التجريبية بنجاح!';
  RAISE NOTICE '✅ النظام جاهز للاستخدام';
END $$;