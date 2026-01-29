import type { PrescriptionSummary } from "../types/prescriptions"
import { request } from "./apiService"

type PrescriptionApiItem = {
  id: number
  medication_name: string
  dosage?: string | null
  quantity?: number | null
  created_at: string
  notes?: string | null
}

type PrescriptionFilters = {
  patientId?: number
}

export async function listPrescriptions(filters: PrescriptionFilters = {}) {
  const query = buildPrescriptionQuery(filters)
  const response = await request<PrescriptionApiItem[]>(
    `/prescriptions${query}`,
  )

  if (!response.success || !response.data) {
    return response
  }

  return {
    ...response,
    data: response.data.map(mapPrescriptionSummary),
  }
}

function buildPrescriptionQuery(filters: PrescriptionFilters) {
  const params = new URLSearchParams()
  if (filters.patientId) params.set("patient_id", String(filters.patientId))
  const query = params.toString()
  return query ? `?${query}` : ""
}

function mapPrescriptionSummary(
  item: PrescriptionApiItem,
): PrescriptionSummary {
  return {
    id: item.id,
    medication_name: item.medication_name,
    dosage: item.dosage ?? null,
    quantity: item.quantity ?? null,
    created_at: item.created_at,
    notes: item.notes ?? null,
  }
}
