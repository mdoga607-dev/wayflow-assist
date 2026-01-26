import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string | null;
  recipient_address: string | null;
  status: string | null;
  cod_amount: number | null;
  created_at: string;
  delegate_id: string | null;
  shipper_id: string | null;
}

export const useRecentShipments = (limit: number = 10) => {
  return useQuery({
    queryKey: ["recent-shipments", limit],
    queryFn: async (): Promise<Shipment[]> => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};
