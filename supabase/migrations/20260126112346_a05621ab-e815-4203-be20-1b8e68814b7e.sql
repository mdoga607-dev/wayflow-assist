-- Add commission calculation trigger
CREATE OR REPLACE FUNCTION public.calculate_delegate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commission_rate NUMERIC := 5.00; -- 5 SAR per successful delivery
BEGIN
  -- When shipment is marked as delivered
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Update delegate stats
    UPDATE public.delegates
    SET 
      total_delivered = COALESCE(total_delivered, 0) + 1,
      commission_due = COALESCE(commission_due, 0) + commission_rate,
      updated_at = now()
    WHERE id = NEW.delegate_id;
    
    -- Set delivered_at timestamp
    NEW.delivered_at = now();
  END IF;
  
  -- When shipment is marked as delayed
  IF NEW.status = 'delayed' AND (OLD.status IS NULL OR OLD.status != 'delayed') THEN
    UPDATE public.delegates
    SET 
      total_delayed = COALESCE(total_delayed, 0) + 1,
      updated_at = now()
    WHERE id = NEW.delegate_id;
  END IF;
  
  -- When shipment is marked as returned
  IF NEW.status = 'returned' AND (OLD.status IS NULL OR OLD.status != 'returned') THEN
    UPDATE public.delegates
    SET 
      total_returned = COALESCE(total_returned, 0) + 1,
      updated_at = now()
    WHERE id = NEW.delegate_id;
    
    -- Set returned_at timestamp
    NEW.returned_at = now();
  END IF;
  
  -- Update shipper stats
  IF NEW.shipper_id IS NOT NULL THEN
    UPDATE public.shippers
    SET 
      active_shipments = (
        SELECT COUNT(*) FROM public.shipments 
        WHERE shipper_id = NEW.shipper_id 
        AND status NOT IN ('delivered', 'returned', 'cancelled')
      ),
      updated_at = now()
    WHERE id = NEW.shipper_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for commission calculation
DROP TRIGGER IF EXISTS calculate_commission_trigger ON public.shipments;
CREATE TRIGGER calculate_commission_trigger
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_delegate_commission();

-- Also handle new shipments for shipper stats
CREATE OR REPLACE FUNCTION public.update_shipper_on_new_shipment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.shipper_id IS NOT NULL THEN
    UPDATE public.shippers
    SET 
      total_shipments = COALESCE(total_shipments, 0) + 1,
      active_shipments = COALESCE(active_shipments, 0) + 1,
      updated_at = now()
    WHERE id = NEW.shipper_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_shipper_stats_trigger ON public.shipments;
CREATE TRIGGER update_shipper_stats_trigger
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shipper_on_new_shipment();

-- Add location tracking columns to shipments
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS current_lat NUMERIC,
ADD COLUMN IF NOT EXISTS current_lng NUMERIC,
ADD COLUMN IF NOT EXISTS destination_lat NUMERIC,
ADD COLUMN IF NOT EXISTS destination_lng NUMERIC;