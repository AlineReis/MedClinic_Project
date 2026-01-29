export const PAYMENT_STATUSES = [
  "generated",
  "pending",
  "processing",
  "paid",
  "failed",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface MonthlyReport {
  id?: number;
  professional_id: number;
  month: number; // 1-12
  year: number;
  total_appointments: number;
  total_gross_amount: number;
  total_net_amount: number;
  total_commission: number;
  total_deductions: number;
  amount_to_receive: number;
  payment_status: PaymentStatus;
  payment_date?: string | null;
  generated_at?: string;
}

export interface MonthlyReportFilters {
  month?: number;
  year?: number;
  payment_status?: PaymentStatus;
}
