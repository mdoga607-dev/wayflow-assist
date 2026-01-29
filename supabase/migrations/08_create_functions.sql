-- دالة لحساب عدد الشحنات في كل شيت
CREATE OR REPLACE FUNCTION public.get_shipments_count_by_sheet(sheet_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.shipments
  WHERE sheet_id = sheet_uuid;
$$;

-- دالة التحقق من وجود البريد الإلكتروني
CREATE OR REPLACE FUNCTION public.check_email_exists(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = email_input) INTO email_exists;
  RETURN email_exists;
END;
$$;

-- تفعيل الـ Realtime للشحنات
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;