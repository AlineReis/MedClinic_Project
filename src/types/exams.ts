export interface ExamSummary {
  id: number
  exam_name: string
  status: string
  created_at: string
  result?: string | null
  patientName?: string
  requestingProfessionalName?: string
  priority?: string
  isUrgent?: boolean
}

export interface ExamDetail {
  id: number
  patient_id: number
  appointment_id: number
  exam_name: string
  status: string
  clinical_indication: string
  exam_price: number
  result: string | null
  created_at: string
}

export interface CreateExamPayload {
  appointment_id: number
  patient_id: number
  exam_name: string
  exam_price: number
  clinical_indication: string
}
