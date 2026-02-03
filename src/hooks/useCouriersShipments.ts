/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCouriersShipments = () => {
  const [delegates, setDelegates] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [returnedSheets, setReturnedSheets] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [courierInfo, setCourierInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. جلب قائمة المناديب
  const fetchDelegates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delegates')
        .select('*') // تم إزالة الربط مع المتاجر مؤقتاً لتجنب الخطأ
        .order('name');
      
      if (error) throw error;
      setDelegates(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. جلب معلومات مندوب محدد
  const fetchCourierInfo = useCallback(async (delegateId: string) => {
    try {
      const { data, error } = await supabase
        .from('delegates')
        .select('*')
        .eq('id', delegateId)
        .single();
      
      if (error) throw error;
      setCourierInfo(data);
    } catch (err: any) {
      console.error("Error fetching courier info:", err);
    }
  }, []);

  // 3. جلب الشيتات الخاصة بالمندوب
  const fetchSheets = useCallback(async (delegateId: string) => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('*')
        .eq('delegate_id', delegateId)
        .eq('sheet_type', 'delivery');
      
      if (error) throw error;
      setSheets(data || []);
    } catch (err: any) {
      console.error("Error fetching sheets:", err);
    }
  }, []);

  // 4. جلب شيتات المرتجعات
  const fetchReturnedSheets = useCallback(async (delegateId: string) => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('*')
        .eq('delegate_id', delegateId)
        .eq('sheet_type', 'return');
      
      if (error) throw error;
      setReturnedSheets(data || []);
    } catch (err: any) {
      console.error("Error fetching returned sheets:", err);
    }
  }, []);

  // 5. جلب الشحنات (أساسي لعرض البيانات في الجدول)
  const fetchShipments = useCallback(async (delegateId: string, sheetId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('shipments')
        .select('*')
        .eq('delegate_id', delegateId);

      if (sheetId && sheetId !== '') {
        query = query.eq('sheet_id', sheetId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setShipments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 6. تغيير حالة الشحنات
  const changeShipmentsStatus = async (shipmentIds: string[], status: string, options: any) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ 
          status: status,
          sheet_id: options.sheetId || null,
          notes: options.notes || undefined
        })
        .in('id', shipmentIds);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    delegates,
    sheets,
    returnedSheets,
    shipments,
    courierInfo,
    loading,
    error,
    fetchDelegates,
    fetchSheets,
    fetchReturnedSheets,
    fetchCourierInfo,
    fetchShipments,
    changeShipmentsStatus
  };
};