import { supabase } from "@/db/client/supabase-browser";
import { Database } from "@/db/types/supabase";

type Donation = Database["public"]["Tables"]["donations"]["Row"];

export const donationQueries = {
  /**
   * Get all donations (optionally filter by status)
   */
  async getDonations(status?: string): Promise<Donation[]> {
    let query = supabase.from("donations").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a donation record
   */
  async createDonation(donation: {
    donor_id: string;
    tenant_id?: string;
    amount: number;
    currency?: string;
    status?: string;
    provider_transaction_id?: string;
    metadata?: Record<string, any>;
  }): Promise<Donation> {
    const { data, error } = await supabase
      .from("donations")
      .insert(donation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all donations by a specific donor
   */
  async getUserDonations(donorId: string): Promise<Donation[]> {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_id", donorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update a donation's payment status
   */
  async updatePaymentStatus(
    donationId: string,
    paymentStatus: string,
    providerTransactionId?: string
  ): Promise<Donation> {
    const { data, error } = await supabase
      .from("donations")
      .update({
        status: paymentStatus,
        provider_transaction_id: providerTransactionId,
        created_at: new Date().toISOString(),
      })
      .eq("id", donationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
