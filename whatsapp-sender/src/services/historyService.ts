import { supabase } from './supabase';
import type { SendingHistory } from '@/types';

interface CreateIndividualParams {
  template_id: string;
  template_name: string;
  phone: string;
  parameters?: Record<string, string>;
}

interface CreateBulkParams {
  template_id: string;
  template_name: string;
  total_sent: number;
  description?: string;
  phone_list?: string[]; // Array of phone numbers
}

export const historyService = {
  // Fetch all sending history
  async getAll(): Promise<SendingHistory[]> {
    const { data, error } = await supabase
      .from('sending_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Fetch recent history (last 50)
  async getRecent(limit: number = 50): Promise<SendingHistory[]> {
    const { data, error } = await supabase
      .from('sending_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Create history entry for individual sending
  async createIndividual(params: CreateIndividualParams): Promise<SendingHistory> {
    const { data, error } = await supabase
      .from('sending_history')
      .insert({
        template_id: params.template_id,
        template_name: params.template_name,
        phone: params.phone,
        sending_type: 'individual',
        status: 'success',
        total_sent: 1,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Create history entry for bulk sending
  async createBulk(params: CreateBulkParams): Promise<SendingHistory> {
    const { data, error } = await supabase
      .from('sending_history')
      .insert({
        template_id: params.template_id,
        template_name: params.template_name,
        description: params.description,
        sending_type: 'bulk',
        status: 'success',
        total_sent: params.total_sent,
        phone_list: params.phone_list ? JSON.stringify(params.phone_list) : null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete history entry
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sending_history')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // Clear all history
  async clearAll(): Promise<void> {
    const { error } = await supabase
      .from('sending_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw new Error(error.message);
  },
};
