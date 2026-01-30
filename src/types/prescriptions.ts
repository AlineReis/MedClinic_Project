export interface PrescriptionSummary {
  id: number
  medication_name: string
  dosage?: string | null
  quantity?: number | null
  created_at: string
  notes?: string | null
}

export interface PrescriptionDetail {
  id: number
  patient_id: number
  professional_id: number
  appointment_id: number
  medication_name: string
  dosage: string | null
  frequency: string | null
  duration_days: number | null
  instructions: string | null
  status: string
  created_at: string
  updated_at: string
  patient?: {
    id: number
    name: string
    email: string
  }
  professional?: {
    id: number
    name: string
    specialty: string
    registration_number: string
  }
}

export interface CreatePrescriptionPayload {
  appointment_id: number
  patient_id: number
  medication_name: string
  dosage?: string
  frequency?: string
  duration_days?: number
  instructions?: string
}
