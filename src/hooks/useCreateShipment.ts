/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; // تأكد من مسار ملف السوبابيس لديك
import { toast } from "@/hooks/use-toast";

// تعريف واجهة البيانات المتوقعة (TypeScript Interface)
export interface CreateShipmentInput {
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string;
  recipient_address: string;
  recipient_area?: string;
  product_name: string;
  cod_amount: number;
  shipping_fee: number;
  weight?: number;
  notes?: string;
  shipper_id?: string;
  delegate_id?: string;
  status?: string;
}

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newShipment: CreateShipmentInput) => {
      // 1. توليد رقم تتبع تلقائي بسيط (أو اتركه لـ Supabase إذا كان هناك Trigger)
      const trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. إرسال البيانات إلى جدول shipments
      const { data, error } = await supabase
        .from("shipments")
        .insert([
          {
            tracking_number: trackingNumber,
            recipient_name: newShipment.recipient_name,
            recipient_phone: newShipment.recipient_phone,
            recipient_city: newShipment.recipient_city,
            recipient_address: newShipment.recipient_address,
            recipient_area: newShipment.recipient_area,
            product_name: newShipment.product_name,
            cod_amount: newShipment.cod_amount,
            shipping_fee: newShipment.shipping_fee,
            weight: newShipment.weight,
            notes: newShipment.notes,
            shipper_id: newShipment.shipper_id,
            delegate_id: newShipment.delegate_id,
            status: newShipment.status || 'pending',
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      // تحديث الكاش لضمان ظهور الشحنة الجديدة في القوائم فوراً
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
    onError: (error: any) => {
      console.error("Supabase Insert Error:", error);
      toast({
        title: "خطأ في قاعدة البيانات",
        description: error.message || "تعذر حفظ الشحنة، تأكد من صلاحيات الوصول.",
        variant: "destructive",
      });
    },
  });
};