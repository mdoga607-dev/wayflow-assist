-- إنشاء نوع الرتب (يجب تنفيذه قبل أي جدول)
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM (
  'head_manager', 'manager', 'courier', 'shipper', 'user', 'guest'
);