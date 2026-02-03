/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ✅ تصدير الـ Types المطلوبة
export interface Delegate {
  id: string;
  name: string;
  phone?: string;
  status?: string;
  store_id?: string;
  store_name?: string;
}

export interface Sheet {
  id: string;
  name: string;
  sheet_type: string;
  delegate_id?: string;
  store_id?: string;
  status?: string;
  notes?: string;
  created_at?: string;
}

export interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address?: string;
  recipient_area?: string;
  recipient_city?: string;
  cod_amount?: number;
  status?: string;
  created_at: string;
  product_name?: string;
  notes?: string;
  shipper_id?: string;
  delegate_id?: string;
  sheet_id?: string;
  order_id?: string;
  shipper_name?: string;
  status_reason?: string;
  shipping_fee?: number;
}

export interface CourierInfo {
  id: string;
  name: string;
  phone?: string;
  store_name?: string;
  balance: number;
  debt_balance: number;
  commission: number;
  shipments_count: number;
  courier_limit?: number;
  shipmentsDeliveredValue?: number;
}

export const useCouriersShipments = () => {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [returnedSheets, setReturnedSheets] = useState<Sheet[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [courierInfo, setCourierInfo] = useState<CourierInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. جلب قائمة المناديب
  const fetchDelegates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delegates')
        .select('*')
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
      
      // حساب عدد الشحنات
      const { count } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('delegate_id', delegateId);
      
      const courierData: CourierInfo = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        balance: data.balance || 0,
        debt_balance: 0,
        commission: data.commission_due || 0,
        shipments_count: count || 0,
        courier_limit: undefined,
        shipmentsDeliveredValue: 0
      };
      
      setCourierInfo(courierData);
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

  // 5. جلب الشحنات
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