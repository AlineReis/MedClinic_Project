import type {
  CreatePrescriptionPayload,
  PrescriptionDetail,
  PrescriptionSummary,
} from "../types/prescriptions"
import { request } from "./apiService"

type PrescriptionApiItem = {
  id: number
  medication_name: string
  dosage?: string | null
  quantity?: number | null
  created_at: string
  notes?: string | null
}

type PrescriptionDetailApiResponse = {
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

type CreatePrescriptionResponse = {
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
}

type PrescriptionFilters = {
  patientId?: number
  professionalId?: number
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
  if (filters.professionalId) params.set("professional_id", String(filters.professionalId))
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

export async function getPrescription(id: number) {
  const response = await request<{ prescription: PrescriptionDetailApiResponse }>(
    `/prescriptions/${id}`,
  )

  if (!response.success || !response.data) {
    return response
  }

  return {
    ...response,
    data: mapPrescriptionDetail(response.data.prescription),
  }
}

export async function createPrescription(payload: CreatePrescriptionPayload) {
  const response = await request<{
    prescription: CreatePrescriptionResponse
    message: string
  }>("/prescriptions", "POST", {
    appointment_id: payload.appointment_id,
    patient_id: payload.patient_id,
    medication_name: payload.medication_name,
    dosage: payload.dosage,
    frequency: payload.frequency,
    duration_days: payload.duration_days,
    instructions: payload.instructions,
  })

  if (!response.success || !response.data) {
    return response
  }

  return {
    ...response,
    data: mapPrescriptionDetail(response.data.prescription),
  }
}

function mapPrescriptionDetail(
  item: PrescriptionDetailApiResponse | CreatePrescriptionResponse,
): PrescriptionDetail {
  return {
    id: item.id,
    patient_id: item.patient_id,
    professional_id: item.professional_id,
    appointment_id: item.appointment_id,
    medication_name: item.medication_name,
    dosage: item.dosage,
    frequency: item.frequency,
    duration_days: item.duration_days,
    instructions: item.instructions,
    status: item.status,
    created_at: item.created_at,
    updated_at: "updated_at" in item ? item.updated_at : item.created_at,
    patient: "patient" in item ? item.patient : undefined,
    professional: "professional" in item ? item.professional : undefined,
  }
}
