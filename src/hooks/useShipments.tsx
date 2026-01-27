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
  return useQuery({
    queryKey: ["shipments"],
    queryFn: async (): Promise<Shipment[]> => {
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
    refetchInterval: 10000,
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
      // Update status in database
      const { data: shipment, error } = await supabase
        .from("shipments")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", shipmentId)
        .select()
        .single();

      if (error) throw error;

      // Send SMS notification if requested
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
            console.error("SMS Error:", smsError);
          }
        } catch (e) {
          console.error("Failed to send SMS:", e);
        }
      }

      return shipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["recent-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الشحنة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الشحنة",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase
        .from("shipments")
        .delete()
        .eq("id", shipmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["recent-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الشحنة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الشحنة",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    },
  });
};
