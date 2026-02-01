/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useDelegates.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDelegates = () => {
  const [delegates, setDelegates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDelegates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('delegates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDelegates(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل جلب المناديب');
        console.error('Error fetching delegates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDelegates();
  }, []);

  return { delegates, loading, error };
};