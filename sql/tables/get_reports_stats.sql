-- دالة للحصول على الإحصائيات العامة
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على البيانات الشهرية
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على تقارير المناديب
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
$$ LANGUAGE plpgsql SECURITY DEFINER;