-- 1. تأكد من وجود مناديب نشطين
INSERT INTO public.delegates (name, phone, city, status, branch)
VALUES 
  ('أحمد محمد', '01111111111', 'القاهرة', 'active', 'فرع القاهرة'),
  ('خالد عبدالله', '01122222222', 'جدة', 'active', 'فرع جدة'),
  ('محمد سعيد', '01133333333', 'الدمام', 'active', 'فرع الدمام')
ON CONFLICT (phone) DO UPDATE SET status = 'active';

-- 2. تأكد من وجود متاجر
INSERT INTO public.stores (name, address, city, phone, status)
VALUES 
  ('فرع القاهرة', 'حي السفارات', 'القاهرة', '0221234567', 'active'),
  ('فرع جدة', 'البلد', 'جدة', '01221234567', 'active'),
  ('فرع الدمام', 'الخبر', 'الدمام', '01321234567', 'active')
ON CONFLICT (name) DO NOTHING;

-- 3. أدخل شيتات تجريبية
INSERT INTO public.sheets (name, sheet_type, delegate_id, store_id, status)
VALUES 
  ('شيت مناديب - ' || CURRENT_DATE, 'courier', 
   (SELECT id FROM public.delegates WHERE name = 'أحمد محمد' LIMIT 1),
   (SELECT id FROM public.stores WHERE name = 'فرع القاهرة' LIMIT 1), 'active'),
  
  ('شيت بيك أب - ' || CURRENT_DATE, 'pickup', 
   (SELECT id FROM public.delegates WHERE name = 'خالد عبدالله' LIMIT 1),
   (SELECT id FROM public.stores WHERE name = 'فرع جدة' LIMIT 1), 'active'),
  
  ('شيت مرتجعات - ' || CURRENT_DATE, 'returned', 
   (SELECT id FROM public.delegates WHERE name = 'محمد سعيد' LIMIT 1),
   (SELECT id FROM public.stores WHERE name = 'فرع الدمام' LIMIT 1), 'active'),
  
  ('شيت سفر - ' || CURRENT_DATE, 'travel', 
   (SELECT id FROM public.delegates WHERE name = 'أحمد محمد' LIMIT 1),
   (SELECT id FROM public.stores WHERE name = 'فرع القاهرة' LIMIT 1), 'active'),
  
  ('شيت مرتجعات سفر - ' || CURRENT_DATE, 'returned_travel', 
   (SELECT id FROM public.delegates WHERE name = 'خالد عبدالله' LIMIT 1),
   (SELECT id FROM public.stores WHERE name = 'فرع جدة' LIMIT 1), 'active')
ON CONFLICT DO NOTHING;

-- 4. أضف شحنات تجريبية
INSERT INTO public.shipments (
  tracking_number, 
  recipient_name, 
  recipient_phone, 
  recipient_address, 
  recipient_city, 
  status, 
  cod_amount, 
  sheet_id,
  delegate_id,
  store_id
)
SELECT 
  'TEST-' || LPAD(gs::text, 6, '0'),
  'عميل تجريبي ' || gs,
  '010' || LPAD((1000000 + gs)::text, 7, '0'),
  'شارع التحرير ' || gs,
  'القاهرة',
  'pending',
  (50 + gs * 10)::decimal,
  s.id,
  s.delegate_id,
  s.store_id
FROM public.sheets s
CROSS JOIN generate_series(1, 5) gs
WHERE s.sheet_type = 'courier'
LIMIT 25
ON CONFLICT DO NOTHING;