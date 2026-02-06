-- =====================================================
-- SECURITY FIX: Restrict overly permissive RLS policies
-- =====================================================

-- 1. Fix DELEGATES table - restrict to owner or manager
DROP POLICY IF EXISTS "Authenticated users can view delegates" ON delegates;

CREATE POLICY "Delegates view own record"
ON delegates FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers view all delegates"
ON delegates FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'head_manager'::app_role));

-- 2. Fix SHIPMENTS table - restrict to ownership/assignment
DROP POLICY IF EXISTS "Authenticated users can view shipments" ON shipments;

CREATE POLICY "Shippers view own shipments"
ON shipments FOR SELECT TO authenticated
USING (
  shipper_id IN (SELECT id FROM shippers WHERE id::text = auth.uid()::text)
  OR delegate_id IN (SELECT id FROM delegates WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'head_manager'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);

-- 3. Fix BALANCE_TRANSACTIONS table - restrict to owner or manager
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON balance_transactions;

CREATE POLICY "Users view own transactions"
ON balance_transactions FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR shipper_id IN (SELECT id FROM shippers WHERE id::text = auth.uid()::text)
  OR delegate_id IN (SELECT id FROM delegates WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'head_manager'::app_role)
);

-- 4. Fix SHEETS table - restrict to relevant parties
DROP POLICY IF EXISTS "Authenticated users can view sheets" ON sheets;

CREATE POLICY "Users view relevant sheets"
ON sheets FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR shipper_id IN (SELECT id FROM shippers WHERE id::text = auth.uid()::text)
  OR delegate_id IN (SELECT id FROM delegates WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'head_manager'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);

-- 5. Fix PICKUP_REQUESTS table - restrict to relevant parties
DROP POLICY IF EXISTS "Authenticated users can view pickup_requests" ON pickup_requests;

CREATE POLICY "Users view relevant pickup_requests"
ON pickup_requests FOR SELECT TO authenticated
USING (
  shipper_id IN (SELECT id FROM shippers WHERE id::text = auth.uid()::text)
  OR delegate_id IN (SELECT id FROM delegates WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'head_manager'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);

-- 6. Fix INVENTORY table - restrict to assigned delegate or manager
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON inventory;

CREATE POLICY "Users view relevant inventory"
ON inventory FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR delegate_id IN (SELECT id FROM delegates WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'head_manager'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);

-- 7. Fix TASKS table - restrict to assigned or manager
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;

CREATE POLICY "Users view relevant tasks"
ON tasks FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR delegate_id IN (SELECT id FROM delegates WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'head_manager'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);

-- =====================================================
-- SECURITY FIX: Add authorization to SECURITY DEFINER functions
-- =====================================================

-- Fix: add_wallet_transaction - restrict to managers
CREATE OR REPLACE FUNCTION add_wallet_transaction(
    p_user_id UUID,
    p_amount DECIMAL(12,2),
    p_transaction_type TEXT,
    p_payment_method TEXT,
    p_reference_number TEXT,
    p_notes TEXT
) RETURNS VOID AS $$
BEGIN
    -- Authorization check: only head_manager can add wallet transactions
    IF NOT has_role(auth.uid(), 'head_manager'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized: Only managers can add wallet transactions';
    END IF;

    INSERT INTO public.wallet_transactions (
        user_id, amount, transaction_type, payment_method, reference_number, notes
    ) VALUES (
        p_user_id, p_amount, p_transaction_type, p_payment_method, p_reference_number, p_notes
    );

    IF p_transaction_type = 'deposit' THEN
        UPDATE public.wallet_balances
        SET balance = balance + p_amount, updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSIF p_transaction_type = 'withdrawal' OR p_transaction_type = 'payment' THEN
        UPDATE public.wallet_balances
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: get_wallet_report - restrict to own wallet or managers
CREATE OR REPLACE FUNCTION get_wallet_report(
    p_user_id UUID,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE(
    transaction_id UUID,
    amount DECIMAL(12,2),
    transaction_type TEXT,
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    transaction_date TIMESTAMPTZ
) AS $$
BEGIN
    -- Authorization check: user can only view own wallet OR is head_manager
    IF auth.uid() != p_user_id AND NOT has_role(auth.uid(), 'head_manager'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized access to wallet data';
    END IF;

    RETURN QUERY
    SELECT 
        id,
        wt.amount,
        wt.transaction_type,
        wt.payment_method,
        wt.reference_number,
        wt.notes,
        wt.transaction_date
    FROM public.wallet_transactions wt
    WHERE wt.user_id = p_user_id
    AND (p_date_from IS NULL OR wt.transaction_date::date >= p_date_from)
    AND (p_date_to IS NULL OR wt.transaction_date::date <= p_date_to)
    ORDER BY wt.transaction_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: delete_sheet - restrict to creator or head_manager
CREATE OR REPLACE FUNCTION delete_sheet(p_sheet_id UUID) 
RETURNS VOID AS $$
BEGIN
    -- Authorization check: only creator or head_manager can delete
    IF NOT EXISTS (
        SELECT 1 FROM public.sheets 
        WHERE id = p_sheet_id 
        AND (created_by = auth.uid() OR has_role(auth.uid(), 'head_manager'::app_role))
    ) THEN
        RAISE EXCEPTION 'Unauthorized to delete sheet';
    END IF;

    DELETE FROM public.sheets WHERE id = p_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: delete_wallet_transaction - restrict to head_manager only
CREATE OR REPLACE FUNCTION delete_wallet_transaction(p_transaction_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Authorization check: only head_manager can delete transactions
    IF NOT has_role(auth.uid(), 'head_manager'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized: Only managers can delete wallet transactions';
    END IF;

    DELETE FROM public.wallet_transactions WHERE id = p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: delete_pickup_request - restrict to creator or head_manager
CREATE OR REPLACE FUNCTION delete_pickup_request(p_request_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check authorization
    IF NOT EXISTS (
        SELECT 1 FROM public.pickup_requests pr
        WHERE pr.id = p_request_id 
        AND (
            pr.shipper_id IN (SELECT id FROM shippers WHERE id::text = auth.uid()::text)
            OR has_role(auth.uid(), 'head_manager'::app_role)
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized to delete pickup request';
    END IF;

    DELETE FROM public.pickup_requests WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: reset_wallet_balance - restrict to head_manager only
CREATE OR REPLACE FUNCTION reset_wallet_balance(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Authorization check: only head_manager can reset balances
    IF NOT has_role(auth.uid(), 'head_manager'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized: Only managers can reset wallet balances';
    END IF;

    UPDATE public.wallet_balances
    SET balance = 0.00, updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: create_pickup_sheet - restrict to managers
CREATE OR REPLACE FUNCTION create_pickup_sheet(
    p_courier_id UUID,
    p_sheet_date DATE,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_sheet_id UUID;
BEGIN
    -- Authorization check: only managers can create pickup sheets
    IF NOT (has_role(auth.uid(), 'head_manager'::app_role) OR has_role(auth.uid(), 'user'::app_role)) THEN
        RAISE EXCEPTION 'Unauthorized: Only managers can create pickup sheets';
    END IF;

    INSERT INTO public.sheets (courier_id, sheet_date, created_by)  
    VALUES (p_courier_id, p_sheet_date, p_created_by)
    RETURNING id INTO v_sheet_id;
    RETURN v_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: update_pickup_request_status - restrict to assigned delegate or manager
CREATE OR REPLACE FUNCTION update_pickup_request_status(
    p_request_id UUID,
    p_new_status TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Authorization check
    IF NOT EXISTS (
        SELECT 1 FROM public.pickup_requests pr
        WHERE pr.id = p_request_id 
        AND (
            pr.delegate_id IN (SELECT id FROM delegates WHERE user_id = auth.uid())
            OR has_role(auth.uid(), 'head_manager'::app_role)
            OR has_role(auth.uid(), 'user'::app_role)
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized to update pickup request status';
    END IF;

    UPDATE public.pickup_requests
    SET status = p_new_status
    WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: get_courier_pickup_requests - restrict to own requests or manager
CREATE OR REPLACE FUNCTION get_courier_pickup_requests(
    p_courier_id UUID,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE(
    request_id UUID,
    merchant_id UUID,
    pickup_address TEXT,
    pickup_date DATE,
    pickup_time TIME,
    notes TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Authorization check: courier can only view own requests OR is manager
    IF NOT EXISTS (
        SELECT 1 FROM delegates WHERE id = p_courier_id AND user_id = auth.uid()
    ) AND NOT has_role(auth.uid(), 'head_manager'::app_role) 
      AND NOT has_role(auth.uid(), 'user'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized access to courier pickup requests';
    END IF;

    RETURN QUERY
    SELECT 
        pr.id,
        pr.shipper_id,
        pr.pickup_address,
        pr.scheduled_date,
        pr.pickup_time::TIME,
        pr.notes,
        pr.status,
        pr.created_at
    FROM public.pickup_requests pr
    WHERE pr.delegate_id = p_courier_id
    AND (p_status IS NULL OR pr.status = p_status)
    ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: get_courier_sheets - restrict to own sheets or manager
CREATE OR REPLACE FUNCTION get_courier_sheets(p_courier_id UUID)
RETURNS TABLE(
    sheet_id UUID,
    sheet_date DATE,
    total_shipments INTEGER,
    completed_shipments INTEGER,
    pending_shipments INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Authorization check
    IF NOT EXISTS (
        SELECT 1 FROM delegates WHERE id = p_courier_id AND user_id = auth.uid()
    ) AND NOT has_role(auth.uid(), 'head_manager'::app_role)
      AND NOT has_role(auth.uid(), 'user'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized access to courier sheets';
    END IF;

    RETURN QUERY
    SELECT 
        s.id,
        s.created_at::DATE,
        s.total_shipments,
        0::INTEGER,
        s.total_shipments,
        s.notes,
        s.created_at
    FROM public.sheets s
    WHERE s.delegate_id = p_courier_id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: update_sheet_statistics - restrict to managers
CREATE OR REPLACE FUNCTION update_sheet_statistics(
    p_sheet_id UUID,
    p_total_shipments INTEGER,
    p_completed_shipments INTEGER,
    p_pending_shipments INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Authorization check: only managers can update sheet statistics
    IF NOT (has_role(auth.uid(), 'head_manager'::app_role) OR has_role(auth.uid(), 'user'::app_role)) THEN
        RAISE EXCEPTION 'Unauthorized to update sheet statistics';
    END IF;

    UPDATE public.sheets
    SET total_shipments = p_total_shipments
    WHERE id = p_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: get_courier_overall_report - restrict to own report or manager
CREATE OR REPLACE FUNCTION get_courier_overall_report(
    p_courier_id UUID,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE(
    total_sheets INTEGER,
    total_pickup_requests INTEGER,
    completed_pickup_requests INTEGER,
    pending_pickup_requests INTEGER,
    wallet_balance DECIMAL(12,2)
) AS $$
BEGIN
    -- Authorization check
    IF NOT EXISTS (
        SELECT 1 FROM delegates WHERE id = p_courier_id AND user_id = auth.uid()
    ) AND NOT has_role(auth.uid(), 'head_manager'::app_role)
      AND NOT has_role(auth.uid(), 'user'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized access to courier report';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.sheets WHERE delegate_id = p_courier_id
         AND (p_date_from IS NULL OR created_at::DATE >= p_date_from)
         AND (p_date_to IS NULL OR created_at::DATE <= p_date_to)),
        (SELECT COUNT(*)::INTEGER FROM public.pickup_requests WHERE delegate_id = p_courier_id
         AND (p_date_from IS NULL OR scheduled_date >= p_date_from)
         AND (p_date_to IS NULL OR scheduled_date <= p_date_to)),
        (SELECT COUNT(*)::INTEGER FROM public.pickup_requests WHERE delegate_id = p_courier_id
         AND status = 'completed'
         AND (p_date_from IS NULL OR scheduled_date >= p_date_from)
         AND (p_date_to IS NULL OR scheduled_date <= p_date_to)),
        (SELECT COUNT(*)::INTEGER FROM public.pickup_requests WHERE delegate_id = p_courier_id
         AND status = 'pending'
         AND (p_date_from IS NULL OR scheduled_date >= p_date_from)
         AND (p_date_to IS NULL OR scheduled_date <= p_date_to)),
        COALESCE((SELECT balance FROM public.wallet_balances WHERE user_id = (
            SELECT user_id FROM delegates WHERE id = p_courier_id
        )), 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: get_reports_stats - restrict to managers
CREATE OR REPLACE FUNCTION get_reports_stats(
  date_from TEXT DEFAULT NULL,
  date_to TEXT DEFAULT NULL
)
RETURNS TABLE(
  total_revenue NUMERIC,
  total_commissions NUMERIC,
  total_shipments BIGINT,
  delivered_count BIGINT,
  pending_count BIGINT,
  delayed_count BIGINT,
  returned_count BIGINT,
  transit_count BIGINT
) AS $$
BEGIN
  -- Authorization check: only managers can view reports
  IF NOT (has_role(auth.uid(), 'head_manager'::app_role) OR has_role(auth.uid(), 'user'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only managers can view reports';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(s.cod_amount), 0)::NUMERIC AS total_revenue,
    COALESCE(SUM(d.commission_due), 0)::NUMERIC AS total_commissions,
    COUNT(s.id)::BIGINT AS total_shipments,
    COUNT(*) FILTER (WHERE s.status = 'delivered')::BIGINT AS delivered_count,
    COUNT(*) FILTER (WHERE s.status = 'pending')::BIGINT AS pending_count,
    COUNT(*) FILTER (WHERE s.status = 'delayed')::BIGINT AS delayed_count,
    COUNT(*) FILTER (WHERE s.status = 'returned')::BIGINT AS returned_count,
    COUNT(*) FILTER (WHERE s.status = 'transit')::BIGINT AS transit_count
  FROM shipments s
  LEFT JOIN delegates d ON s.delegate_id = d.id
  WHERE 
    (date_from IS NULL OR s.created_at >= date_from::DATE) AND
    (date_to IS NULL OR s.created_at <= date_to::DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: get_monthly_reports - restrict to managers
CREATE OR REPLACE FUNCTION get_monthly_reports(
  date_from TEXT DEFAULT NULL,
  date_to TEXT DEFAULT NULL
)
RETURNS TABLE(
  month_year TEXT,
  total_revenue NUMERIC,
  total_commissions NUMERIC,
  total_shipments BIGINT
) AS $$
BEGIN
  -- Authorization check: only managers can view reports
  IF NOT (has_role(auth.uid(), 'head_manager'::app_role) OR has_role(auth.uid(), 'user'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only managers can view monthly reports';
  END IF;

  RETURN QUERY
  SELECT
    TO_CHAR(s.created_at, 'YYYY-MM') AS month_year,
    COALESCE(SUM(s.cod_amount), 0)::NUMERIC AS total_revenue,
    COALESCE(SUM(d.commission_due), 0)::NUMERIC AS total_commissions,
    COUNT(s.id)::BIGINT AS total_shipments
  FROM shipments s
  LEFT JOIN delegates d ON s.delegate_id = d.id
  WHERE 
    (date_from IS NULL OR s.created_at >= date_from::DATE) AND
    (date_to IS NULL OR s.created_at <= date_to::DATE)
  GROUP BY TO_CHAR(s.created_at, 'YYYY-MM')
  ORDER BY month_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix: get_delegate_reports - restrict to managers
CREATE OR REPLACE FUNCTION get_delegate_reports(
  date_from TEXT DEFAULT NULL,
  date_to TEXT DEFAULT NULL
)
RETURNS TABLE(
  delegate_id UUID,
  delegate_name TEXT,
  total_delivered BIGINT,
  total_delayed BIGINT,
  total_returned BIGINT,
  success_rate NUMERIC,
  commission_due NUMERIC
) AS $$
BEGIN
  -- Authorization check: only managers can view delegate reports
  IF NOT (has_role(auth.uid(), 'head_manager'::app_role) OR has_role(auth.uid(), 'user'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only managers can view delegate reports';
  END IF;

  RETURN QUERY
  SELECT
    d.id AS delegate_id,
    d.name AS delegate_name,
    COUNT(*) FILTER (WHERE s.status = 'delivered')::BIGINT AS total_delivered,
    COUNT(*) FILTER (WHERE s.status = 'delayed')::BIGINT AS total_delayed,
    COUNT(*) FILTER (WHERE s.status = 'returned')::BIGINT AS total_returned,
    CASE 
      WHEN COUNT(s.id) > 0 
      THEN (COUNT(*) FILTER (WHERE s.status = 'delivered')::NUMERIC / COUNT(s.id)::NUMERIC)
      ELSE 0
    END AS success_rate,
    COALESCE(SUM(d.balance), 0)::NUMERIC AS commission_due
  FROM delegates d
  LEFT JOIN shipments s ON d.id = s.delegate_id
  WHERE 
    d.status = 'active' AND
    (date_from IS NULL OR s.created_at >= date_from::DATE) AND
    (date_to IS NULL OR s.created_at <= date_to::DATE)
  GROUP BY d.id, d.name, d.balance
  ORDER BY total_delivered DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;