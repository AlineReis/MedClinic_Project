import type { AppointmentSummary } from "../types/appointments"
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

export async function listAppointments(filters: AppointmentFilters = {}) {
  const query = buildAppointmentQuery(filters)
  const response = await request<AppointmentApiItem[]>(`/appointments${query}`)

  if (!response.success || !response.data) {
    return response
  }

  return {
    ...response,
    data: response.data.map(mapAppointmentSummary),
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
