export enum CommissionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PAID = "paid",
  FAILED = "failed",
}

export interface CommissionRecord {
  id: number;
  appointment_id: number;
  amount: number;
  status: CommissionStatus;
  created_at: string;
  paid_at: string | null;
}

export interface CommissionSummary {
  pending: number;
  paid: number;
  total: number;
}

export interface CommissionResponse {
  summary: CommissionSummary;
  details: CommissionRecord[];
}
