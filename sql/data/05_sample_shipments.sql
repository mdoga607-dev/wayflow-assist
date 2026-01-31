-- ========================================
-- بيانات تجريبية للشحنات (للبدء السريع)
-- ========================================

-- 1. إدخال شحنة تجريبية
INSERT INTO public.shipments (
  tracking_number, 
  recipient_name, 
  recipient_phone, 
  recipient_address, 
  recipient_city, 
  status, 
  cod_amount, 
  shipping_fee
) VALUES (
  'TEST123456',                     -- رقم البوليصة
  'أحمد محمد',                      -- اسم المستلم
  '01000000000',                    -- رقم الهاتف
  'شارع التحرير، ميدان التحرير',    -- العنوان
  'القاهرة',                        -- المدينة
  'pending',                        -- الحالة
  250.00,                           -- مبلغ التحصيل
  25.00                             -- رسوم الشحن
) ON CONFLICT (tracking_number) DO NOTHING;

-- 2. إدخال شحنة ثانية مع مندوب وتاجر
INSERT INTO public.shipments (
  tracking_number, 
  recipient_name, 
  recipient_phone, 
  recipient_address, 
  recipient_city, 
  delegate_id,
  shipper_id,
  area_id,
  status, 
  cod_amount, 
  shipping_fee,
  product_name
) 
SELECT 
  'TEST123457',
  'خالد عبدالله',
  '01011111111',
  'حي السفارات، شارع الملك فهد',
  'الرياض',
  d.id,  -- معرف المندوب
  s.id,  -- معرف التاجر
  a.id,  -- معرف المنطقة
  'out_for_delivery',
  320.50,
  30.00,
  'هاتف ذكي + شاحن'
FROM 
  public.delegates d,
  public.shippers s,
  public.areas a
WHERE 
  d.phone = '01111111111'   -- مندوب تجريبي
  AND s.phone = '01222222222' -- تاجر تجريبي
  AND a.name = 'القاهرة - وسط' -- منطقة تجريبية
LIMIT 1
ON CONFLICT (tracking_number) DO NOTHING;

-- 3. إدخال شحنة ثالثة (مرتجعة)
INSERT INTO public.shipments (
  tracking_number, 
  recipient_name, 
  recipient_phone, 
  recipient_address, 
  recipient_city, 
  status, 
  cod_amount, 
  shipping_fee,
  return_reason,
  returned_at
) VALUES (
  'TEST123458',
  'محمد سعيد',
  '01022222222',
  'حي الشرفية، شارع الأمير محمد',
  'جدة',
  'returned',
  180.00,
  25.00,
  'العميل غير موجود في العنوان',
  NOW() - INTERVAL '2 days'
) ON CONFLICT (tracking_number) DO NOTHING;

-- 4. التحقق من الإدخال
DO $$
DECLARE
  shipment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO shipment_count FROM public.shipments;
  RAISE NOTICE '✅ تم إدخال % شحنة تجريبية بنجاح', shipment_count;
END $$;