// hooks/useShipments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string | null;
  recipient_area: string | null;
  recipient_address: string | null;
  status: string | null;
  cod_amount: number | null;
  shipping_fee: number | null;
  product_name: string | null;
  created_at: string;
  updated_at: string;
  delegate_id: string | null;
  shipper_id: string | null;
  notes: string | null;
  delegates?: { name: string } | null;
  shippers?: { name: string } | null;
}

export const useShipments = () => {
  return useQuery<Shipment[]>({
    queryKey: ["shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select(`
          *,
          delegates:delegate_id(name),
          shippers:shipper_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // 30 ثانية
    staleTime: 5000, // 5 ثواني
  });
};

export const useUpdateShipmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shipmentId,
      newStatus,
      sendSMS = false,
    }: {
      shipmentId: string;
      newStatus: string;
      sendSMS?: boolean;
    }) => {
      const { data: shipment, error } = await supabase
        .from("shipments")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", shipmentId)
        .select()
        .single();

      if (error) throw error;

      // إرسال SMS إذا طلب المستخدم
      if (sendSMS && shipment) {
        try {
          const { error: smsError } = await supabase.functions.invoke("send-sms", {
            body: {
              shipment_id: shipment.id,
              new_status: newStatus,
              recipient_phone: shipment.recipient_phone,
              recipient_name: shipment.recipient_name,
              tracking_number: shipment.tracking_number,
            },
          });

          if (smsError) {
            console.warn("SMS sending failed:", smsError);
          }
        } catch (err) {
          console.warn("SMS function invocation error:", err);
        }
      }

      return shipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الشحنة بنجاح",
      });
    },
    onError: (err: unknown) => {
      let errorMessage = "تعذر تحديث حالة الشحنة";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Update shipment status error:", err);
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase.from("shipments").delete().eq("id", shipmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الشحنة بنجاح",
      });
    },
    onError: (err: unknown) => {
      let errorMessage = "تعذر حذف الشحنة";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Delete shipment error:", err);
    },
  });
};