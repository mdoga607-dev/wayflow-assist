CREATE OR REPLACE FUNCTION create_pickup_sheet(
    p_courier_id UUID,
    p_sheet_date DATE,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_sheet_id UUID;
BEGIN
    INSERT INTO public.sheets (courier_id, sheet_date, created_by)  
    VALUES (p_courier_id, p_sheet_date, p_created_by)
    RETURNING id INTO v_sheet_id;
    RETURN v_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لإضافة معاملة إلى محفظة المستخدم
CREATE OR REPLACE FUNCTION add_wallet_transaction(
    p_user_id UUID,
    p_amount DECIMAL(12,2),
    p_transaction_type TEXT,
    p_payment_method TEXT,
    p_reference_number TEXT,
    p_notes TEXT
)RETURNS VOID AS $$
BEGIN
    INSERT INTO public.wallet_transactions (
        user_id, amount, transaction_type, payment_method, reference_number, notes
    ) VALUES (
        p_user_id, p_amount, p_transaction_type, p_payment_method, p_reference_number, p_notes
    );

    -- تحديث رصيد المحفظة
    IF p_transaction_type = 'deposit' THEN
        UPDATE public.wallet_balances
        SET balance = balance + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSIF p_transaction_type = 'withdrawal' OR p_transaction_type = 'payment' THEN
        UPDATE public.wallet_balances
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لتوليد تقرير المحفظة لمستخدم معين
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
    RETURN QUERY
    SELECT 
        id,
        amount,
        transaction_type,
        payment_method,
        reference_number,
        notes,
        transaction_date
    FROM public.wallet_transactions
    WHERE user_id = p_user_id
    AND (p_date_from IS NULL OR transaction_date::date >= p_date_from)
    AND (p_date_to IS NULL OR transaction_date::date <= p_date_to)
    ORDER BY transaction_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لتحديث حالة طلبات البيك أب
CREATE OR REPLACE FUNCTION update_pickup_request_status(
    p_request_id UUID,
    p_new_status TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.pickup_requests
    SET status = p_new_status
    WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة للحصول على طلبات البيك أب لمندوب معين
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
    RETURN QUERY
    SELECT 
        id,
        merchant_id,
        pickup_address,
        pickup_date,
        pickup_time,
        notes,
        status,
        created_at
    FROM public.pickup_requests
    WHERE courier_id = p_courier_id
    AND (p_status IS NULL OR status = p_status)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة للحصول على شيتات المندوب
CREATE OR REPLACE FUNCTION get_courier_sheets(
    p_courier_id UUID
)
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
    RETURN QUERY
    SELECT 
        id,
        sheet_date,
        total_shipments,
        completed_shipments,
        pending_shipments,
        notes,
        created_at
    FROM public.sheets
    WHERE courier_id = p_courier_id
    ORDER BY sheet_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لتحديث إحصائيات الشيت
CREATE OR REPLACE FUNCTION update_sheet_statistics(
    p_sheet_id UUID,
    p_total_shipments INTEGER,
    p_completed_shipments INTEGER,
    p_pending_shipments INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.sheets
    SET total_shipments = p_total_shipments,
        completed_shipments = p_completed_shipments,
        pending_shipments = p_pending_shipments
    WHERE id = p_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لحذف شيت معين
CREATE OR REPLACE FUNCTION delete_sheet(

    p_sheet_id UUID
) 
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.sheets
    WHERE id = p_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لحذف معاملة محفظة معينة
CREATE OR REPLACE FUNCTION delete_wallet_transaction(
    p_transaction_id UUID
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.wallet_transactions
    WHERE id = p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لحذف طلب بيك أب معين
CREATE OR REPLACE FUNCTION delete_pickup_request(
    p_request_id UUID
)
RETURNS VOID AS $$

BEGIN
    DELETE FROM public.pickup_requests
    WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لتوليد تقرير شامل للمندوب
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
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.sheets WHERE courier_id = p_courier_id
         AND (p_date_from IS NULL OR sheet_date >= p_date_from)
         AND (p_date_to IS NULL OR sheet_date <= p_date_to)) AS total_sheets,
        (SELECT COUNT(*) FROM public.pickup_requests WHERE courier_id = p_courier_id
         AND (p_date_from IS NULL OR pickup_date >= p_date_from)
         AND (p_date_to IS NULL OR pickup_date <= p_date_to)) AS total_pickup_requests,
        (SELECT COUNT(*) FROM public.pickup_requests WHERE courier_id = p_courier_id
         AND status = 'completed'
         AND (p_date_from IS NULL OR pickup_date >= p_date_from)
         AND (p_date_to IS NULL OR pickup_date <= p_date_to)) AS completed_pickup_requests,
        (SELECT COUNT(*) FROM public.pickup_requests WHERE courier_id = p_courier_id
         AND status = 'pending'
         AND (p_date_from IS NULL OR pickup_date >= p_date_from)
         AND (p_date_to IS NULL OR pickup_date <= p_date_to)) AS pending_pickup_requests,
        (SELECT balance FROM public.wallet_balances WHERE user_id = p_courier_id) AS wallet_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لتفريغ رصيد المحفظة إلى صفر
CREATE OR REPLACE FUNCTION reset_wallet_balance(
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.wallet_balances
    SET balance = 0.00,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لتحديث ملاحظات الشيت
CREATE OR REPLACE FUNCTION update_sheet_notes(
    p_sheet_id UUID,
    p_notes TEXT
)
RETURNS VOID AS $$
