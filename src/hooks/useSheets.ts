/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useSheets.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSheets = (sheetType?: string) => {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('sheets')
          .select(`
            *,
            delegates!inner (name, phone),
            stores!inner (name)
          `)
          .order('created_at', { ascending: false });

        if (sheetType) {
          query = query.eq('sheet_type', sheetType);
        }

        const { data, error } = await query;

        if (error) throw error;
        setSheets(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل جلب الشيتات');
        console.error('Error fetching sheets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSheets();
  }, [sheetType]);

  return { sheets, loading, error };
};