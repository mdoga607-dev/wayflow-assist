-- إضافة أعمدة التتبع لجدول المناديب إذا لم تكن موجودة
ALTER TABLE public.delegates 
ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_delivered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'القاهرة';

-- إدخال بيانات مصرية تجريبية
INSERT INTO public.delegates (name, phone, city, status, current_location, last_location_update, total_delivered) 
VALUES 
  ('محمد أحمد عبد الرحمن', '01001234567', 'القاهرة', 'active', 'القاهرة، المعادي، شارع 90', NOW() - INTERVAL '2 minutes', 1250),
  ('أحمد محمد السيد', '01002345678', 'القاهرة', 'busy', 'القاهرة، مدينة نصر، شارع مكرم عبيد', NOW() - INTERVAL '5 minutes', 980),
  ('خالد سعيد إبراهيم', '01003456789', 'الجيزة', 'active', 'الجيزة، المهندسين، شارع السودان', NOW() - INTERVAL '1 minute', 1420),
  ('محمود فؤاد كامل', '01004567890', 'الإسكندرية', 'on_leave', 'الإسكندرية، سموحة', NOW() - INTERVAL '1 day', 750),
  ('سامي عبد الفتاح حسن', '01005678901', 'القاهرة', 'active', 'القاهرة، التجمع الخامس، شارع التسعين', NOW() - INTERVAL '3 minutes', 890),
  ('إسلام محمد علي', '01006789012', 'القاهرة', 'busy', 'القاهرة، المهندسين، شارع جامعة الدول', NOW() - INTERVAL '7 minutes', 1100),
  ('مصطفى أحمد عبد العزيز', '01007890123', 'الجيزة', 'active', 'الجيزة، الدقي، شارع الهرم', NOW() - INTERVAL '4 minutes', 950),
  ('عمرو سيد أحمد', '01008901234', 'القاهرة', 'inactive', 'القاهرة، المعادي', NULL, 600),
  ('وائل محمد فتحي', '01009012345', 'الإسكندرية', 'active', 'الإسكندرية، سبورتنج', NOW() - INTERVAL '6 minutes', 720),
  ('إسلام خالد سعيد', '01010123456', 'القاهرة', 'busy', 'القاهرة، المعادي، دجلة', NOW() - INTERVAL '8 minutes', 1300)
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  status = EXCLUDED.status,
  current_location = EXCLUDED.current_location,
  last_location_update = EXCLUDED.last_location_update,
  total_delivered = EXCLUDED.total_delivered;