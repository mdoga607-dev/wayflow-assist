-- إضافة أعمدة التتبع لجدول المناديب إذا لم تكن موجودة
ALTER TABLE public.delegates 
ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_delivered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'القاهرة';

-- إنشاء دالة لتحديث موقع المندوب
CREATE OR REPLACE FUNCTION update_delegate_location(
  p_delegate_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_location TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE delegates
  SET 
    current_lat = p_lat,
    current_lng = p_lng,
    current_location = p_location,
    last_location_update = NOW(),
    last_seen = NOW()
  WHERE id = p_delegate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء عرض لبيانات تتبع المناديب
CREATE OR REPLACE VIEW delegate_tracking_view AS
SELECT 
  d.id,
  d.name,
  d.phone,
  d.status,
  d.current_location,
  d.last_location_update,
  d.avatar_url,
  d.city,
  d.last_seen,
  d.total_delivered,
  COUNT(s.id) FILTER (WHERE s.status IN ('pending', 'transit', 'out_for_delivery')) AS active_shipments
FROM delegates d
LEFT JOIN shipments s ON d.id = s.delegate_id AND s.status != 'delivered'
GROUP BY d.id, d.name, d.phone, d.status, d.current_location, d.last_location_update, d.avatar_url, d.city, d.last_seen, d.total_delivered;

-- تفعيل سياسات الأمان
ALTER TABLE public.delegates ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: المديرين فقط
CREATE POLICY "Enable read for managers" 
  ON public.delegates FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

-- سياسة التحديث: المديرين والمناديب أنفسهم
CREATE POLICY "Enable update for delegates and managers" 
  ON public.delegates FOR UPDATE 
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('head_manager', 'manager')
    )
  );

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
  ('عمرو سيد أحمد', '01008901234', 'القاهرة', 'inactive', NULL, NULL, 600),
  ('وائل محمد فتحي', '01009012345', 'الإسكندرية', 'active', 'الإسكندرية، سبورتنج', NOW() - INTERVAL '6 minutes', 720),
  ('إسلام خالد سعيد', '01010123456', 'القاهرة', 'busy', 'القاهرة، المعادي، دجلة', NOW() - INTERVAL '8 minutes', 1300)
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  status = EXCLUDED.status,
  current_location = EXCLUDED.current_location,
  last_location_update = EXCLUDED.last_location_update,
  total_delivered = EXCLUDED.total_delivered;