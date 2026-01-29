/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Sheet {
  id: string;
  name: string;
  sheet_type: string;
  delegate_id: string;
  created_at: string;
  delegate?: {
    name: string;
    phone: string;
  };
  shipments_count?: number;
}

export interface CreateSheetData {
  name: string;
  sheet_type: string;
  delegate_id: string;
  shipment_ids: string[];
}

export const useSheets = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب جميع الشيتات مع معلومات المناديب وعدد الشحنات
  const fetchSheets = async (sheetType: string = 'courier') => {
    setLoading(true);
    setError(null);
    
    try {
      // جلب الشيتات مع معلومات المناديب
      const { data: sheetsData, error: sheetsError } = await supabase
        .from('sheets')
        .select(`
          id,
          name,
          sheet_type,
          delegate_id,
          created_at,
          delegates (
            name,
            phone
          )
        `)
        .eq('sheet_type', sheetType)
        .order('created_at', { ascending: false });

      if (sheetsError) throw sheetsError;

      // حساب عدد الشحنات لكل شيت باستخدام دالة SQL
      const sheetsWithCount = await Promise.all(
        (sheetsData || []).map(async (sheet) => {
          const { data: countData } = await supabase
            .rpc('get_shipments_count_by_sheet', { sheet_uuid: sheet.id });
          
          return {
            ...sheet,
            shipments_count: countData || 0,
            delegate: sheet.delegates as any
          };
        })
      );

      setSheets(sheetsWithCount);
    } catch (err: any) {
      console.error('Error fetching sheets:', err);
      setError(err.message || 'فشل تحميل الشيتات');
    } finally {
      setLoading(false);
    }
  };

  // إنشاء شيت جديد
  const createSheet = async (sheetData: CreateSheetData) => {
    try {
      // 1. إنشاء الشيت
      const { data: sheet, error: sheetError } = await supabase
        .from('sheets')
        .insert({
          name: sheetData.name,
          sheet_type: sheetData.sheet_type,
          delegate_id: sheetData.delegate_id
        })
        .select()
        .single();

      if (sheetError) throw sheetError;
      if (!sheet) throw new Error('فشل إنشاء الشيت');

      // 2. ربط الشحنات بالشيت
      if (sheetData.shipment_ids.length > 0) {
        const { error: updateError } = await supabase
          .from('shipments')
          .update({ sheet_id: sheet.id })
          .in('id', sheetData.shipment_ids);

        if (updateError) throw updateError;
      }

      // 3. تحديث قائمة الشيتات
      await fetchSheets(sheetData.sheet_type);
      
      return { success: true, sheet_id: sheet.id };
    } catch (err: any) {
      console.error('Error creating sheet:', err);
      return { success: false, error: err.message || 'فشل إنشاء الشيت' };
    }
  };

  // حذف شيت
  const deleteSheet = async (sheetId: string) => {
    try {
      // فصل الشحنات عن الشيت أولاً
      await supabase
        .from('shipments')
        .update({ sheet_id: null })
        .eq('sheet_id', sheetId);

      // ثم حذف الشيت
      const { error } = await supabase
        .from('sheets')
        .delete()
        .eq('id', sheetId);

      if (error) throw error;
      
      // تحديث القائمة
      await fetchSheets('courier');
      
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting sheet:', err);
      return { success: false, error: err.message || 'فشل حذف الشيت' };
    }
  };

  // تفاصيل الشيت (الشحنات المرتبطة)
  const getSheetDetails = async (sheetId: string) => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          tracking_number,
          recipient_name,
          recipient_phone,
          status,
          cod_amount,
          shippers(name)
        `)
        .eq('sheet_id', sheetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { 
        success: true, 
        shipments: data?.map(s => ({
          ...s,
          shipper_name: (s.shippers as any)?.name || 'غير معروف'
        })) || [] 
      };
    } catch (err: any) {
      console.error('Error fetching sheet details:', err);
      return { success: false, error: err.message || 'فشل تحميل تفاصيل الشيت' };
    }
  };

  // تصدير الشيت إلى Excel
  const exportSheetToExcel = async (sheetId: string) => {
    try {
      const details = await getSheetDetails(sheetId);
      if (!details.success) throw new Error(details.error);
      
      // هنا يمكنك تنفيذ منطق التصدير إلى Excel
      // مثال: استخدام مكتبة مثل xlsx
      console.log('Exporting sheet:', details.shipments);
      
      return { success: true };
    } catch (err: any) {
      console.error('Error exporting sheet:', err);
      return { success: false, error: err.message || 'فشل تصدير الشيت' };
    }
  };

  return {
    sheets,
    loading,
    error,
    fetchSheets,
    createSheet,
    deleteSheet,
    getSheetDetails,
    exportSheetToExcel
  };
};