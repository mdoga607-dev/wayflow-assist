-- 1. إضافة متجر تجريبي
INSERT INTO public.stores (name, address, city) 
VALUES ('فرع القاهرة الرئيسي', 'وسط البلد', 'القاهرة')
ON CONFLICT (name) DO NOTHING;

-- 2. إضافة مندوب تجريبي
INSERT INTO public.delegates (name, phone, store_id)
VALUES ('أحمد محمد المندوب', '01012345678', (SELECT id FROM stores LIMIT 1))
ON CONFLICT (phone) DO NOTHING;

-- 3. إضافة شيت تجريبي (بدون علامات استفهام)
INSERT INTO public.sheets (name, sheet_type, delegate_id, store_id, status)
VALUES ('شيت تسليمات السبت', 'courier', (SELECT id FROM delegates LIMIT 1), (SELECT id FROM stores LIMIT 1), 'active');

-- 4. ربط بعض الشحنات بالشيت (تأكد من وجود شحنات أولاً)
UPDATE public.shipments 
SET sheet_id = (SELECT id FROM sheets LIMIT 1)
WHERE id IN (SELECT id FROM shipments LIMIT 5);