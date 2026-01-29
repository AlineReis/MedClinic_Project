export type ExamType = "blood" | "image";

export const EXAM_REQUEST_STATUS = [
  "pending_payment",
  "paid",
  "scheduled",
  "sample_collected",
  "processing",
  "ready",
  "released", // RN-14: Result released to patient and professional
  "delivered",
  "cancelled",
  "expired", // RN-12: Expired after 30 days in pending_payment
] as const;

export type ExamRequestStatus = (typeof EXAM_REQUEST_STATUS)[number];

export interface ExamCatalog {
  id: number;
  name: string;
  type: ExamType;
  base_price: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ExamRequest {
  id: number;
  appointment_id: number;
  patient_id: number;
  requesting_professional_id: number;
  exam_catalog_id: number;
  clinical_indication: string;
  price: number;
  status: ExamRequestStatus;
  payment_status: "pending" | "processing" | "paid" | "failed" | "refunded";
  scheduled_date?: string;
  result_file_url?: string;
  result_text?: string;
  lab_tech_id?: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateExamRequestPayload = Omit<
  ExamRequest,
  "id" | "status" | "payment_status" | "created_at" | "updated_at" | "price"
>;
// Price geralmente é pego do catálogo no backend para segurança
