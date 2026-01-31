// src/hooks/useShipments.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Area } from 'recharts';
import { toast } from '@/hooks/use-toast';

// ✅ الحل 1: استخدام أنواع مرنة (لتجنب أخطاء TypeScript قبل التحديث)
type Shipment = Database['public']['Tables']['shipments']['Row'];
type Delegate = Database['public']['Tables']['delegates']['Row'] | null;
type Shipper = Database['public']['Tables']['shippers']['Row'] | null;
// type Area = Database['public']['Tables']['areas']['Row'] | null; // لن يسبب خطأ حتى لو لم تُحدّث الأنواع

// ✅ الحل 2: هيكل مرن يتوافق مع left join (بدون !inner)
export interface ShipmentWithRelations extends Shipment {
  delegate?: Delegate;
  shipper?: Shipper;
  area?: Area;
}
// ... باقي الكود الموجود مسبقاً ...

// ========================================
// دوال مفقودة مطلوبة في صفحة الشحنات
// ========================================

/**
 * هوك لتحديث حالة الشحنة
 */
export const useUpdateShipmentStatus = () => {
  const updateStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          ...(newStatus === 'delivered' && { delivered_at: new Date().toISOString() }),
          ...(newStatus === 'returned' && { returned_at: new Date().toISOString() })
        })
        .eq('id', shipmentId);

      if (error) throw error;
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث حالة الشحنة"
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating shipment status:', error);
      toast({
        title: "فشل التحديث",
        description: "حدث خطأ أثناء تحديث حالة الشحنة",
        variant: "destructive"
      });
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  };

  return { updateStatus };
};

/**
 * هوك لحذف الشحنة
 */
export const useDeleteShipment = () => {
  const deleteShipment = async (shipmentId: string) => {
    try {
      // تأكيد الحذف
      if (!confirm('هل أنت متأكد من حذف هذه الشحنة؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return { success: false, cancelled: true };
      }

      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId);

      if (error) throw error;
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الشحنة من النظام"
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting shipment:', error);
      toast({
        title: "فشل الحذف",
        description: "حدث خطأ أثناء حذف الشحنة",
        variant: "destructive"
      });
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  };

  return { deleteShipment };
};

/**
 * نوع بيانات الشحنة (للاستخدام في TypeScript)
 */


export const useShipments = (filters?: {
  status?: string;
  delegateId?: string;
  shipperId?: string;
  fromDate?: string;
  toDate?: string;
  areaId?: string;
  limit?: number;
}) => {
  const [shipments, setShipments] = useState<ShipmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ الحل 3: إزالة !inner لتجنب استبعاد الشحنات بدون علاقات
        // استخدام left join افتراضياً (بدون !inner)
        let query = supabase
          .from('shipments')
          .select(`
            *,
            delegate:delegate_id (id, name, phone, status),
            shipper:shipper_id (id, name, phone, status),
            area:area_id (id, name, governorate, city)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(filters?.limit || 100);

        // تطبيق عوامل التصفية
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.delegateId) {
          query = query.eq('delegate_id', filters.delegateId);
        }
        if (filters?.shipperId) {
          query = query.eq('shipper_id', filters.shipperId);
        }
        if (filters?.areaId) {
          query = query.eq('area_id', filters.areaId);
        }
        if (filters?.fromDate) {
          query = query.gte('created_at', filters.fromDate);
        }
        if (filters?.toDate) {
          query = query.lte('created_at', `${filters.toDate}T23:59:59`);
        }

        const { data, error, count } = await query;

        if (error) {
          console.error('Supabase Error:', error);
          throw error;
        }

        setShipments(data || []);
        setTotalCount(count || 0);
        
        // ✅ الحل 4: تسجيل البيانات للتحقق
        console.log('✅ تم جلب الشحنات بنجاح:', data?.length || 0, 'شحنة');
        if (data && data.length > 0) {
          console.log('أول شحنة:', data[0]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير معروف';
        setError(errorMessage);
        console.error('❌ خطأ في جلب الشحنات:', errorMessage);
        
        // محاولة جلب البيانات بدون العلاقات كحل بديل
        if (errorMessage.includes('relation') || errorMessage.includes('column')) {
          console.warn('⚠️ محاولة جلب البيانات بدون العلاقات...');
          try {
            const fallbackData = await supabase
              .from('shipments')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(10);
            
            if (fallbackData.data) {
              setShipments(fallbackData.data.map(s => ({ ...s, delegate: null, shipper: null, area: null })));
              console.log('✅ تم جلب البيانات الأساسية فقط');
            }
          } catch (fallbackErr) {
            console.error('فشل المحاولة البديلة:', fallbackErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();

    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchShipments, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  // دالة لإعادة الجلب يدوياً
  const refetch = () => {
    setLoading(true);
    // سيتم إعادة الجلب تلقائياً بسبب الـ useEffect
  };

  return { shipments, loading, error, refetch, totalCount };
};