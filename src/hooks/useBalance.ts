import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBalance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = async (data: {
    shipper_id?: string;
    delegate_id?: string;
    store_id?: string;
    amount: number;
    transaction_type: string;
    payment_method?: string;
    reference_number?: string;
    notes?: string;
    transaction_date: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // تحويل "none" إلى undefined
      const cleanedData = {
        ...data,
        shipper_id: data.shipper_id === 'none' ? undefined : data.shipper_id,
        delegate_id: data.delegate_id === 'none' ? undefined : data.delegate_id,
        store_id: data.store_id === 'none' ? undefined : data.store_id,
      };

      const { error: insertError } = await supabase
        .from('balance_transactions')
        .insert([{
          ...cleanedData,
          amount: parseFloat(cleanedData.amount.toString()),
          created_by: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw insertError;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل إضافة العملية المالية';
      setError(errorMessage);
      console.error('Error creating transaction:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createTransaction, loading, error };
};