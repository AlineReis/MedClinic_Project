export interface PrescriptionSummary {
  id: number
  medication_name: string
  dosage?: string | null
  quantity?: number | null
  created_at: string
  notes?: string | null
}
