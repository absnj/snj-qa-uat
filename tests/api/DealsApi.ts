// api/DealsApi.ts
import { ApiClient } from '@core/index';

export type DealPayload = {
  merchant_store_id: string;
  for_all_branches: boolean;
  branch_ids: string[];
  title: string;
  description: string;
  full_description: string;
  deal_value: string;
  minimum_spend: string;
  value_attribute: 'percentage' | 'fixed';
  merchant_category_id?: string;
  merchant_sub_category_id?: string;
  currency_code: string;
  current_quantity: string;
  unlimited_quantity: boolean;
  photos?: string[];
  status: 'in-approval' | 'active' | 'inactive' | 'disabled';
  terms: string;
  keywords?: string[];
  no_expiry: boolean;
  start_date: string;
  start_time: string;
  end_date: string | null;
  end_time: string | null;
};

export type Deal = DealPayload & { deals_id: string };

export class DealsApi extends ApiClient {
  async createDeal(token: string, data: DealPayload): Promise<Deal> {
    return this.post<Deal>('/deals', data, token);
  }

  async getDeals(token: string, filters?: Record<string, string>): Promise<Deal[]> {
    return this.get<Deal[]>('/deals', token, filters);
  }

  async getDeal(token: string, dealId: string): Promise<Deal> {
    return this.get<Deal>(`/deals/${dealId}`, token);
  }

  async updateDeal(token: string, dealId: string, data: Partial<DealPayload>): Promise<Deal> {
    return this.patch<Deal>(`/deals/${dealId}`, data, token);
  }

  async deleteDeal(token: string, dealId: string): Promise<void> {
    await this.delete<void>(`/deals/${dealId}`, token);
  }
}
