/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Sheet {
  id: string;
  name: string;
  sheet_type: string;
  status: string;
  created_at: string;
  delegate: { name: string; phone: string | null } | null;
  store: { name: string } | null;
  shipments_count: number;
}

export const useSheets = (sheetType?: string) => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // بناء الاستعلام الأساسي
      const query = supabase
        .from("sheets")
        .select(`
          id, name, sheet_type, status, created_at,
          delegate:delegate_id(name, phone),
          store:store_id(name),
          shipments(count)
        `)
        .order("created_at", { ascending: false });

      // تصفية حسب النوع إذا كان موجوداً في الرابط
      if (sheetType && sheetType !== "") {
        query.eq("sheet_type", sheetType);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        // الحل السحري لمشكلة الـ Cache: لو الجدول مش موجود، لا تظهر خطأ أحمر للمستخدم
        if (
          dbError.code === 'PGRST204' || 
          dbError.code === 'PGRST205' || 
          dbError.message.includes('not find') ||
          dbError.message.includes('does not exist')
        ) {
          console.warn("⚠️ الجدول 'sheets' غير موجود حالياً في Schema Cache الخاص بـ Supabase.");
          setSheets([]); // نرجع مصفوفة فاضية عشان الصفحة تشتغل عادي
          return;
        }
        throw dbError; // لو خطأ تاني (زي ضعف نت) يطلعه عادي
      }

      // تحويل البيانات لشكل يفهمه الجدول في الـ UI
      const normalized = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        sheet_type: s.sheet_type,
        status: s.status || 'active',
        created_at: s.created_at,
        delegate: s.delegate || null,
        store: s.store || null,
        shipments_count: s.shipments?.[0]?.count || 0,
      }));

      setSheets(normalized);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sheetType]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  return { sheets, loading, error, refetch: fetchSheets };
};