import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalShipments: number;
  delivered: number;
  inTransit: number;
  delayed: number;
  totalDelegates: number;
  totalBalance: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch shipment stats
      const { data: shipments, error: shipmentsError } = await supabase
        .from("shipments")
        .select("status, cod_amount");

      if (shipmentsError) throw shipmentsError;

      const totalShipments = shipments?.length || 0;
      const delivered = shipments?.filter(s => s.status === "delivered").length || 0;
      const inTransit = shipments?.filter(s => s.status === "transit").length || 0;
      const delayed = shipments?.filter(s => s.status === "delayed").length || 0;

      // Fetch delegates count
      const { count: delegatesCount, error: delegatesError } = await supabase
        .from("delegates")
        .select("*", { count: "exact", head: true });

      if (delegatesError) throw delegatesError;

      // Calculate total balance from COD amounts of delivered shipments
      const totalBalance = shipments
        ?.filter(s => s.status === "delivered")
        .reduce((sum, s) => sum + (s.cod_amount || 0), 0) || 0;

      return {
        totalShipments,
        delivered,
        inTransit,
        delayed,
        totalDelegates: delegatesCount || 0,
        totalBalance,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
