export type RecipientType = "professional" | "clinic" | "system";
export type CommissionStatus = "pending" | "processing" | "paid" | "failed";

export interface CommissionSplit {
  id?: number;
  transaction_id: number;
  recipient_id?: number | null;
  recipient_type: RecipientType;
  percentage: number;
  amount: number;
  status?: CommissionStatus;
  paid_at?: string;
  created_at?: string;
}

export interface CommissionSplitFilters {
  transaction_id?: number;
  recipient_id?: number;
  status?: CommissionStatus;
  startDate?: string;
  endDate?: string;
}
