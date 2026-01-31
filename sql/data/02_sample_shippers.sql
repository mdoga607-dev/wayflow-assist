-- ========================================
-- بيانات تجريبية للتجار
-- ========================================
INSERT INTO public.shippers (name, phone, email, address, city, status) 
VALUES 
  ('شركة النور للتجارة', '01222222222', 'nor@example.com', 'حي السفارات', 'الرياض', 'active'),
  ('متجر الفخر الإلكتروني', '01233333333', 'fakhr@example.com', 'البلد', 'جدة', 'active'),
  ('محلات السعادة العامة', '01244444444', 'saada@example.com', 'الخبر', 'الدمام', 'active')
ON CONFLICT (phone) DO NOTHING;