import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Delegate {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  status: string | null;
  total_delivered: number | null;
  total_delayed: number | null;
  commission_due: number | null;
}

export const useDelegates = () => {
  return useQuery({
    queryKey: ["delegates"],
    queryFn: async (): Promise<Delegate[]> => {
      const { data, error } = await supabase
        .from("delegates")
        .select("id, name, phone, city, status, total_delivered, total_delayed, commission_due")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
};
