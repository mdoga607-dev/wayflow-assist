/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useShippers = () => {
  const [shippers, setShippers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShippers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shippers')
          .select('id, name, phone, status')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        setShippers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل جلب التجار');
        console.error('Error fetching shippers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShippers();
  }, []);

  return { shippers, loading, error };
};