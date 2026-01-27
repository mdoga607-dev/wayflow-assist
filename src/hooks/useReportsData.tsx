import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportStats {
  totalRevenue: number;
  totalCommissions: number;
  totalShipments: number;
  deliveredCount: number;
  pendingCount: number;
  delayedCount: number;
  returnedCount: number;
  transitCount: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  commissions: number;
  shipments: number;
}

export interface DelegateReport {
  id: string;
  name: string;
  totalDelivered: number;
  totalDelayed: number;
  totalReturned: number;
  commissionDue: number;
  successRate: number;
}

export const useReportsData = () => {
  return useQuery({
    queryKey: ["reports-data"],
    queryFn: async () => {
      // Fetch shipments data
      const { data: shipments, error: shipmentsError } = await supabase
        .from("shipments")
        .select("*");

      if (shipmentsError) throw shipmentsError;

      // Fetch delegates data
      const { data: delegates, error: delegatesError } = await supabase
        .from("delegates")
        .select("*");

      if (delegatesError) throw delegatesError;

      // Calculate stats
      const totalRevenue = shipments?.reduce((sum, s) => sum + (s.cod_amount || 0), 0) || 0;
      const totalShippingFees = shipments?.reduce((sum, s) => sum + (s.shipping_fee || 0), 0) || 0;
      const totalCommissions = delegates?.reduce((sum, d) => sum + (d.commission_due || 0), 0) || 0;

      const stats: ReportStats = {
        totalRevenue: totalRevenue + totalShippingFees,
        totalCommissions,
        totalShipments: shipments?.length || 0,
        deliveredCount: shipments?.filter(s => s.status === 'delivered').length || 0,
        pendingCount: shipments?.filter(s => s.status === 'pending').length || 0,
        delayedCount: shipments?.filter(s => s.status === 'delayed').length || 0,
        returnedCount: shipments?.filter(s => s.status === 'returned').length || 0,
        transitCount: shipments?.filter(s => s.status === 'transit').length || 0,
      };

      // Generate monthly data (mock for now, can be enhanced with real date grouping)
      const monthlyData: MonthlyData[] = [
        { month: "يناير", revenue: 45000, commissions: 2250, shipments: 150 },
        { month: "فبراير", revenue: 52000, commissions: 2600, shipments: 175 },
        { month: "مارس", revenue: 48000, commissions: 2400, shipments: 160 },
        { month: "أبريل", revenue: 61000, commissions: 3050, shipments: 200 },
        { month: "مايو", revenue: 55000, commissions: 2750, shipments: 185 },
        { month: "يونيو", revenue: 67000, commissions: 3350, shipments: 220 },
      ];

      // Delegate reports
      const delegateReports: DelegateReport[] = (delegates || []).map(d => {
        const total = (d.total_delivered || 0) + (d.total_delayed || 0) + (d.total_returned || 0);
        return {
          id: d.id,
          name: d.name,
          totalDelivered: d.total_delivered || 0,
          totalDelayed: d.total_delayed || 0,
          totalReturned: d.total_returned || 0,
          commissionDue: d.commission_due || 0,
          successRate: total > 0 ? Math.round((d.total_delivered || 0) / total * 100) : 0,
        };
      });

      return {
        stats,
        monthlyData,
        delegateReports,
        shipments: shipments || [],
        delegates: delegates || [],
      };
    },
    refetchInterval: 30000,
  });
};
