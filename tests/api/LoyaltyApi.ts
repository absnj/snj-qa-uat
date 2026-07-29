// api/LoyaltyApi.ts
import { ApiClient } from '@core/index';

export type LoyaltySetupPayload = {
  merchant_store_id: string;
  for_all_branches: boolean;
  branch_ids: string[];
  title: string;
  description: string;
  full_description: string;
  start_date: string;
  end_date: string;
  type: 'visit' | 'transaction_value';
  transaction_per_stamp?: number;
  visits_per_stamp?: number;
  merchant_category_id?: string;
  merchant_sub_category_id?: string;
  display_type: 'card' | 'ladder';
  redemption_points?: number[];
  redemption_visit?: number[];
  photos?: string[];
  status: 'active' | 'inactive' | 'disabled';
  terms: string;
  keywords?: string[];
};

export type LoyaltySetup = LoyaltySetupPayload & { loyalty_setup_id: string };

export class LoyaltyApi extends ApiClient {
  async createLoyaltySetup(token: string, data: LoyaltySetupPayload): Promise<LoyaltySetup> {
    return this.post<LoyaltySetup>('/loyalty-setups', data, token);
  }

  async getLoyaltySetups(token: string, filters?: Record<string, string>): Promise<LoyaltySetup[]> {
    return this.get<LoyaltySetup[]>('/loyalty-setups', token, filters);
  }

  async getLoyaltySetup(token: string, loyaltySetupId: string): Promise<LoyaltySetup> {
    return this.get<LoyaltySetup>(`/loyalty-setups/${loyaltySetupId}`, token);
  }

  async updateLoyaltySetup(
    token: string,
    loyaltySetupId: string,
    data: Partial<LoyaltySetupPayload>,
  ): Promise<LoyaltySetup> {
    return this.patch<LoyaltySetup>(`/loyalty-setups/${loyaltySetupId}`, data, token);
  }

  async deleteLoyaltySetup(token: string, loyaltySetupId: string): Promise<void> {
    await this.delete<void>(`/loyalty-setups/${loyaltySetupId}`, token);
  }
}
