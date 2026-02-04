CREATE OR REPLACE FUNCTION create_pickup_sheet(
  p_delegate_id UUID,
  p_store_id UUID,
  p_shipment_ids UUID[]
) RETURNS JSON AS $$
DECLARE
  v_sheet_id UUID;
  v_sheet_name TEXT;
BEGIN
  -- 1. إنشاء اسم الشيت
  v_sheet_name := 'PICK-' || to_char(NOW(), 'YYYYMMDD-HH24MISS');

  -- 2. إنشاء سجل الشيت
  INSERT INTO public.sheets (sheet_name, sheet_type, created_by, status)
  VALUES (v_sheet_name, 'pickup', p_delegate_id, 'active')
  RETURNING id INTO v_sheet_id;

  -- 3. تحديث الشحنات وربطها بالشيت
  UPDATE public.shipments
  SET sheet_id = v_sheet_id,
      status = 'transit' -- أو الحالة التي تفضلها عند بدء البيك أب
  WHERE id = ANY(p_shipment_ids);

  RETURN json_build_object(
    'sheet_id', v_sheet_id,
    'sheet_name', v_sheet_name,
    'shipment_count', array_length(p_shipment_ids, 1)
  );
END;
$$ LANGUAGE plpgsql;