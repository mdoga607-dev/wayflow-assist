/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useBalance.ts
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BalanceTransaction {
  id: string;
  shipper_id?: string;
  delegate_id?: string;
  store_id?: string;
  amount: number;
  transaction_type: 'payment' | 'collection' | 'refund' | 'expense' | 'transfer';
  payment_method?: 'cash' | 'bank_transfer' | 'wallet' | 'credit';
  reference_number?: string;
  notes?: string;
  transaction_date: string;
  created_by?: string;
  created_at: string;
  shipper?: { name: string };
  delegate?: { name: string };
  store?: { name: string };
}

export interface CreateBalanceTransaction {
  shipper_id?: string;
  delegate_id?: string;
  store_id?: string;
  amount: number;
  transaction_type: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  transaction_date?: string;
}

export const useBalance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShippers = async () => {
    try {
      const { data, error } = await supabase
        .from('shippers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching shippers:', err);
      setError(err.message || 'فشل تحميل التجار');
      return [];
    }
  };

  const fetchDelegates = async () => {
    try {
      const { data, error } = await supabase
        .from('delegates')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching delegates:', err);
      setError(err.message || 'فشل تحميل المناديب');
      return [];
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching stores:', err);
      setError(err.message || 'فشل تحميل المتاجر');
      return [];
    }
  };

  const createTransaction = async (transactionData: CreateBalanceTransaction) => {
    setLoading(true);
    setError(null);
    
    try {
      const amount = parseFloat(transactionData.amount.toString());
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('المبلغ يجب أن يكون رقماً موجباً');
      }

      const { data, error } = await supabase
        .from('balance_transactions')
        .insert([{
          ...transactionData,
          amount,
          transaction_date: transactionData.transaction_date || new Date().toISOString(),
          created_by: user?.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      return { success: true, transaction: data };
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message || 'فشل إنشاء العملية المالية');
      return { success: false, error: err.message || 'فشل إنشاء العملية المالية' };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchShippers,
    fetchDelegates,
    fetchStores,
    createTransaction
  };
};