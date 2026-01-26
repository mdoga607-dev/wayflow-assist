import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Shipper {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  status: string | null;
}

export const useShippers = () => {
  return useQuery({
    queryKey: ["shippers"],
    queryFn: async (): Promise<Shipper[]> => {
      const { data, error } = await supabase
        .from("shippers")
        .select("id, name, phone, email, city, status")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
};
