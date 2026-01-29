export type TransactionType = "appointment_payment" | "exam_payment" | "refund";
export type ReferenceType = "appointment" | "exam";
export type PaymentMethod = "credit_card" | "debit_card" | "pix" | "boleto";
export type TransactionStatus =
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface Transaction {
  id?: number;
  type: TransactionType;
  reference_id: number;
  reference_type: ReferenceType;
  payer_id: number;
  amount_gross: number;
  mdr_fee: number;
  amount_net: number;
  installments?: number;
  payment_method?: PaymentMethod;
  gateway_transaction_id?: string;
  card_brand?: string;
  card_last4?: string;
  status?: TransactionStatus;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  payer_id?: number;
  startDate?: string;
  endDate?: string;
}
