import type { AppointmentSummary } from "../types/appointments"
import type { ApiResponse } from "./apiService"
import { request } from "./apiService"

type AppointmentFilters = {
  patientId?: number
  professionalId?: number
  status?: string
  date?: string
  upcoming?: boolean
}

type AppointmentApiItem = {
  id: number
  patient?: { id: number; name: string }
  professional?: { id: number; name: string; specialty?: string }
  date: string
  time: string
  status: string
  price?: number
  room_number?: string | null
}

export async function listAppointments(
  filters: AppointmentFilters = {},
): Promise<ApiResponse<AppointmentSummary[]>> {
  const query = buildAppointmentQuery(filters)
  const response = await request<AppointmentApiItem[]>(`/appointments${query}`)

  if (!response.success || !response.data) {
    return response as ApiResponse<AppointmentSummary[]>
  }

  return {
    ...response,
    data: response.data.map(mapAppointmentSummary),
  }
}

type CreateAppointmentPayload = {
  patientId: number
  professionalId: number
  date: string
  time: string
  type: string
  price?: number
}

export async function createAppointment(
  payload: CreateAppointmentPayload,
): Promise<ApiResponse<AppointmentSummary>> {
  const body = {
    patient_id: payload.patientId,
    professional_id: payload.professionalId,
    date: payload.date,
    time: payload.time,
    type: payload.type,
    price: payload.price,
  }

  const response = await request<AppointmentApiItem>("/appointments", "POST", body)

  if (!response.success || !response.data) {
    return response as ApiResponse<AppointmentSummary>
  }

  return {
    ...response,
    data: mapAppointmentSummary(response.data),
  }
}

function buildAppointmentQuery(filters: AppointmentFilters) {
  const params = new URLSearchParams()

  if (filters.patientId) params.set("patient_id", String(filters.patientId))
  if (filters.professionalId) {
    params.set("professional_id", String(filters.professionalId))
  }
  if (filters.status) params.set("status", filters.status)
  if (filters.date) params.set("date", filters.date)
  if (filters.upcoming !== undefined) {
    params.set("upcoming", String(filters.upcoming))
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}

function mapAppointmentSummary(item: AppointmentApiItem): AppointmentSummary {
  return {
    id: item.id,
    patient_id: item.patient?.id ?? 0,
    patient_name: item.patient?.name ?? "",
    professional_id: item.professional?.id ?? 0,
    professional_name: item.professional?.name ?? "",
    specialty: item.professional?.specialty ?? "",
    date: item.date,
    time: item.time,
    status: item.status,
    price: item.price,
    room: item.room_number ?? null,
  }
}

// ============ Cancelamento (DELETE /appointments/:id) ============

type CancelAppointmentResponse = {
  appointment: {
    id: number
    status: string
    payment_status: string
  }
  refund?: {
    amount: number
    percentage: number
    reason: string
    processing: string
  }
  message: string
}

export async function cancelAppointment(
  appointmentId: number,
  reason?: string,
): Promise<ApiResponse<CancelAppointmentResponse>> {
  const body = reason ? { reason } : undefined
  return request<CancelAppointmentResponse>(
    `/appointments/${appointmentId}`,
    "DELETE",
    body,
  )
}

// ============ Reagendamento (POST /appointments/:id/reschedule) ============

type ReschedulePayload = {
  newDate: string
  newTime: string
}

type RescheduleResponse = {
  appointment: {
    id: number
    date: string
    time: string
    status: string
    payment_status: string
    updated_at: string
  }
  message: string
}

export async function rescheduleAppointment(
  appointmentId: number,
  payload: ReschedulePayload,
): Promise<ApiResponse<RescheduleResponse>> {
  const body = {
    new_date: payload.newDate,
    new_time: payload.newTime,
  }
  return request<RescheduleResponse>(
    `/appointments/${appointmentId}/reschedule`,
    "POST",
    body,
  )
}

// ============ Detalhes do agendamento (GET /appointments/:id) ============

export async function getAppointment(
  appointmentId: number,
): Promise<ApiResponse<AppointmentSummary>> {
  const response = await request<AppointmentApiItem>(
    `/appointments/${appointmentId}`,
  )

  if (!response.success || !response.data) {
    return response as ApiResponse<AppointmentSummary>
  }

  return {
    ...response,
    data: mapAppointmentSummary(response.data),
  }
}

// ============ Mapeamento de erros RN para mensagens amigáveis ============

const RN_ERROR_MESSAGES: Record<string, string> = {
  SLOT_NOT_AVAILABLE: "Este horário não está mais disponível. Por favor, escolha outro.",
  INSUFFICIENT_NOTICE: "Agendamento requer antecedência mínima de 2 horas para consultas presenciais.",
  DUPLICATE_APPOINTMENT: "Você já possui um agendamento com este profissional nesta data.",
  NEW_SLOT_NOT_AVAILABLE: "O novo horário selecionado não está disponível.",
  CANNOT_CANCEL: "Não é possível cancelar este agendamento no status atual.",
  APPOINTMENT_NOT_FOUND: "Agendamento não encontrado.",
  PROFESSIONAL_NOT_FOUND: "Profissional não encontrado.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  OVERLAPPING_TIMES: "Os horários informados se sobrepõem.",
}

export function getErrorMessage(errorCode: string, fallback: string): string {
  return RN_ERROR_MESSAGES[errorCode] ?? fallback
}
