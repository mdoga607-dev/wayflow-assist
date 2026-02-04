-- إصلاح سياسة الوصول للشحنات للضيوف
-- حذف السياسة القديمة المفتوحة
DROP POLICY IF EXISTS "Guests can view shipments by tracking number" ON public.shipments;

-- إنشاء دالة آمنة للبحث عن الشحنات بواسطة رقم التتبع والهاتف
CREATE OR REPLACE FUNCTION public.get_shipment_by_tracking(
  p_tracking_number text,
  p_phone_last_4 text
)
RETURNS TABLE (
  id uuid,
  tracking_number text,
  recipient_name text,
  recipient_city text,
  status text,
  cod_amount numeric,
  shipping_fee numeric,
  created_at timestamptz,
  delivered_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.tracking_number,
    s.recipient_name,
    s.recipient_city,
    s.status,
    s.cod_amount,
    s.shipping_fee,
    s.created_at,
    s.delivered_at
  FROM public.shipments s
  WHERE s.tracking_number = p_tracking_number
    AND RIGHT(s.recipient_phone, 4) = p_phone_last_4;
END;
$$;

-- منح صلاحية التنفيذ للمستخدمين غير المسجلين
GRANT EXECUTE ON FUNCTION public.get_shipment_by_tracking(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shipment_by_tracking(text, text) TO authenticated;

-- إنشاء سياسة جديدة آمنة - فقط للمستخدمين المسجلين
CREATE POLICY "Authenticated users can view shipments"
ON public.shipments FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- التأكد من وجود الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_phone ON public.shipments(recipient_phone);

-- التأكد من وجود سياسات صحيحة لجميع الجداول
-- تحديث سياسات جدول المناديب
DROP POLICY IF EXISTS "Delegates can view own record" ON public.delegates;
DROP POLICY IF EXISTS "Users can view delegates" ON public.delegates;

CREATE POLICY "Authenticated users can view delegates"
ON public.delegates FOR SELECT
TO authenticated
USING (true);

-- تحديث سياسات جدول الشحنات
DROP POLICY IF EXISTS "Users can view shipments" ON public.shipments;

-- إضافة سياسة للمناديب لتحديث شحناتهم
CREATE POLICY "Delegates can update their shipments"
ON public.shipments FOR UPDATE
TO authenticated
USING (
  delegate_id IN (
    SELECT id FROM public.delegates WHERE user_id = auth.uid()
  )
);

-- سياسة للمستخدمين العاديين لإضافة شحنات
CREATE POLICY "Users can insert shipments"
ON public.shipments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);