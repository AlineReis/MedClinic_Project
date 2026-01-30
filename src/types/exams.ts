export interface ExamSummary {
  id: number;
  exam_name: string;
  status: string;
  created_at: string;
  result?: string | null;
  // Issue #506: Backend retorna em snake_case
  patient_name?: string; // For lab_tech/admin views
  urgency?: "normal" | "urgent" | "critical";
  payment_status?: string;
  scheduled_date?: string;
  // Upstream: Campos adicionais
  requestingProfessionalName?: string;
}

export interface ExamDetail {
  id: number;
  patient_id: number;
  appointment_id: number;
  exam_name: string;
  status: string;
  clinical_indication: string;
  exam_price: number;
  result: string | null;
  created_at: string;
}

export interface CreateExamPayload {
  appointment_id: number;
  patient_id: number;
  exam_name: string;
  exam_price: number;
  clinical_indication: string;
}
