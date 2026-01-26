import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateShipmentData {
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
}

const generateTrackingNumber = () => {
  const prefix = "SHP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShipmentData) => {
      const tracking_number = generateTrackingNumber();
      
      const { data: shipment, error } = await supabase
        .from("shipments")
        .insert({
          ...data,
          tracking_number,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return shipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "تم إضافة الشحنة بنجاح",
        description: "تم إنشاء الشحنة الجديدة وإرسالها للمندوب",
      });
    },
    onError: (error) => {
      console.error("Error creating shipment:", error);
      toast({
        title: "خطأ في إضافة الشحنة",
        description: "حدث خطأ أثناء إضافة الشحنة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });
};
