/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Delegate {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  branch?: string;
  city?: string;
  balance: number;
  commission_due: number;
  status: string;
  courier_limit?: number;
  store_id?: string;
  store_name?: string;
}

export interface Sheet {
  id: string;
  name: string;
  sheet_type: string;
}

export interface Shipment {
  id: string;
  tracking_number: string;
  order_id?: string;
  shipper_name: string;
  recipient_name: string;
  recipient_area: string;
  recipient_phone: string;
  status: string;
  status_reason?: string;
  cod_amount?: number;
  attempts_num?: number;
  scheduled_date?: string;
  in_balance?: number;
  created_at: string;
  delegate_id: string;
  tasks_count?: number; // ✅ أضف هذه السطر (مع علامة الاستفهام لجعلها اختيارية)
}

export interface CourierInfo {
  id: string;
  name: string;
  avatar_url?: string;
  branch?: string;
  city?: string;
  balance: number;
  debt_balance: number;
  commission: number;
  shipments_count: number;
  shipmentsDeliveredValue?: number;
  courier_limit?: number;
  store_id?: string;
  store_name?: string;
}

export const useCouriersShipments = () => {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [returnedSheets, setReturnedSheets] = useState<Sheet[]>([]);
  const [shipments, setShipments] = useState<Record<string, Shipment[]>>({});
  const [courierInfo, setCourierInfo] = useState<CourierInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب قائمة المناديب
  const fetchDelegates = async () => {
    try {
      const { data, error } = await supabase
        .from('delegates')
        .select(`
          id,
          name,
          phone,
          avatar_url,
          branch,
          city,
          balance,
          commission_due,
          status,
          courier_limit,
          store_id,
          stores!inner(name)
        `)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      
      const formatted = (data || []).map(d => ({
        ...d,
        store_name: (d.stores as any)?.name
      }));
      
      setDelegates(formatted);
    } catch (err: any) {
      console.error('Error fetching delegates:', err);
      setError(err.message || 'فشل تحميل قائمة المناديب');
    }
  };

  // جلب الشيتات
  const fetchSheets = async (delegateId: string) => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('id, name, sheet_type')
        .eq('delegate_id', delegateId)
        .eq('sheet_type', 'courier')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSheets(data || []);
    } catch (err: any) {
      console.error('Error fetching sheets:', err);
    }
  };

  // جلب شيتات المرتجعات
  const fetchReturnedSheets = async (delegateId: string) => {
    try {
      const { data, error } = await supabase
        .from('sheets')
        .select('id, name, sheet_type')
        .eq('delegate_id', delegateId)
        .eq('sheet_type', 'returned')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturnedSheets(data || []);
    } catch (err: any) {
      console.error('Error fetching returned sheets:', err);
    }
  };

  // جلب معلومات المندوب
  const fetchCourierInfo = async (delegateId: string) => {
    try {
      const { data, error } = await supabase
        .from('delegates')
        .select(`
          id,
          name,
          avatar_url,
          branch,
          city,
          balance,
          commission_due,
          courier_limit,
          store_id,
          stores!inner(name)
        `)
        .eq('id', delegateId)
        .single();

      if (error || !data) throw error || new Error('لم يتم العثور على بيانات المندوب');

      // حساب عدد الشحنات
      const { count, error: countError } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('delegate_id', delegateId);

      if (countError) throw countError;

      setCourierInfo({
        id: data.id,
        name: data.name,
        avatar_url: data.avatar_url || undefined,
        branch: data.branch || undefined,
        city: data.city || undefined,
        balance: data.balance || 0,
        debt_balance: 0,
        commission: data.commission_due || 0,
        shipments_count: count || 0,
        courier_limit: data.courier_limit || undefined,
        store_id: data.store_id || undefined,
        store_name: (data.stores as any)?.name || undefined
      });
    } catch (err: any) {
      console.error('Error fetching courier info:', err);
      setError(err.message || 'فشل تحميل معلومات المندوب');
    }
  };

  // جلب شحنات المندوب
  const fetchShipments = async (delegateId: string, sheetId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('shipments')
        .select(`
          id,
          tracking_number,
          order_id,
          shippers!inner(name),
          recipient_name,
          recipient_area,
          recipient_phone,
          status,
          status_reason,
          cod_amount,
          attempts_num,
          scheduled_date,
          in_balance,
          created_at,
          delegate_id
        `)
        .eq('delegate_id', delegateId)
        .order('created_at', { ascending: false });

      if (sheetId) {
        query = query.eq('sheet_id', sheetId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // جلب عدد المهام لكل شحنة
      const shipmentIds = data.map(s => s.id);
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('shipment_id')
        .in('shipment_id', shipmentIds)
        .eq('task_status', 'pending');

      // حساب عدد المهام لكل شحنة
      const tasksCountMap = shipmentIds.reduce((acc, id) => {
        acc[id] = tasksData?.filter(t => t.shipment_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      // تنسيق البيانات
      const formattedShipments: Shipment[] = data.map(s => ({
        id: s.id,
        tracking_number: s.tracking_number,
        order_id: s.order_id || '',
        shipper_name: (s.shippers as any)?.name || 'غير معروف',
        recipient_name: s.recipient_name,
        recipient_area: s.recipient_area || '',
        recipient_phone: s.recipient_phone,
        status: s.status || 'pending',
        status_reason: s.status_reason || '',
        cod_amount: s.cod_amount || 0,
        attempts_num: s.attempts_num || 0,
        scheduled_date: s.scheduled_date || '',
        in_balance: s.in_balance || 0,
        created_at: s.created_at,
        delegate_id: s.delegate_id,
        tasks_count: tasksCountMap[s.id] || 0
      }));

      // تجميع الشحنات حسب الحالة
      const grouped = formattedShipments.reduce((acc, shipment) => {
        const status = shipment.status;
        if (!acc[status]) acc[status] = [];
        acc[status].push(shipment);
        return acc;
      }, {} as Record<string, Shipment[]>);

      setShipments(grouped);
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError(err.message || 'فشل تحميل الشحنات');
    } finally {
      setLoading(false);
    }
  };

  // تغيير حالة الشحنات
  const changeShipmentsStatus = async (
    shipmentIds: string[],
    statusId: string,
    options?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ 
          status: statusId, 
          updated_at: new Date().toISOString() 
        })
        .in('id', shipmentIds);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Error changing shipments status:', err);
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