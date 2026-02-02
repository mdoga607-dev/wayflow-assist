/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useSheets.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Sheet {
  id: string;
  name: string;
  sheet_type?: string | null;
  status?: string | null;
  created_at: string;
  delegate?: {
    name: string;
    phone?: string | null;
  } | null;
  store?: {
    name: string;
  } | null;
  shipments_count?: number | null;
}

export const useSheets = (sheetType?: string) => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from("sheets")
          .select(
            `
              id,
              name,
              sheet_type,
              status,
              created_at,
              delegate:delegate_id(name, phone),
              store:store_id(name),
              shipments:shipments(count)
            `
          )
          .order("created_at", { ascending: false });

        if (sheetType) {
          query = query.eq("sheet_type", sheetType);
        }

        const { data, error } = await query;
        if (error) throw error;

        const rows = (data || []) as any[];
        const normalized: Sheet[] = rows.map((s) => {
          const delegate = Array.isArray(s?.delegate) ? s.delegate?.[0] : s?.delegate;
          const store = Array.isArray(s?.store) ? s.store?.[0] : s?.store;
          const shipmentsAgg = Array.isArray(s?.shipments) ? s.shipments : null;

          return {
            id: s.id,
            name: s.name,
            sheet_type: s.sheet_type ?? null,
            status: s.status ?? null,
            created_at: s.created_at,
            delegate: delegate
              ? {
                  name: delegate.name,
                  phone: delegate.phone ?? null,
                }
              : null,
            store: store
              ? {
                  name: store.name,
                }
              : null,
            shipments_count: shipmentsAgg?.[0]?.count ?? s.shipments_count ?? 0,
          };
        });

        setSheets(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل جلب الشيتات");
        console.error("Error fetching sheets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSheets();
  }, [sheetType]);

  return { sheets, loading, error };
};