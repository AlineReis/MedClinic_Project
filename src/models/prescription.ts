export interface Prescription {
  id: number;
  appointment_id: number;
  patient_id: number;
  professional_id: number;
  medication_name: string;
  dosage?: string;
  instructions?: string;
  is_controlled: boolean;
  pdf_url?: string;
  created_at?: string;
}

export type CreatePrescriptionPayload = Omit<
  Prescription,
  "id" | "created_at" | "pdf_url"
>;
