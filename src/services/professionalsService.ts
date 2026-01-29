import type {
  ProfessionalAvailabilityEntry,
  ProfessionalAvailabilityResponse,
  ProfessionalSummary,
} from "../types/professionals"
import type { ApiResponse } from "./apiService"
import { request } from "./apiService"

type ProfessionalFilters = {
  specialty?: string
  name?: string
  page?: number
  pageSize?: number
}

type ProfessionalsApiResponse = {
  data: ProfessionalSummary[]
  pagination?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

type AvailabilityFilters = {
  startDate?: string
  endDate?: string
  daysAhead?: number
}

export async function listProfessionals(
  filters: ProfessionalFilters = {},
): Promise<ApiResponse<ProfessionalsApiResponse>> {
  const query = buildProfessionalsQuery(filters)
  const response = await request<unknown>(`/professionals${query}`)

  if (Array.isArray(response)) {
    return {
      success: true,
      data: {
        data: response as ProfessionalSummary[],
      },
    }
  }

  if (!response || typeof response !== "object" || !("success" in response)) {
    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Resposta inesperada do servidor",
        statusCode: 0,
      },
    }
  }

  const typed = response as ApiResponse<
    ProfessionalsApiResponse | ProfessionalSummary[]
  >

  if (!typed.success || !typed.data) {
    return typed as ApiResponse<ProfessionalsApiResponse>
  }

  if (Array.isArray(typed.data)) {
    return {
      ...typed,
      data: {
        data: typed.data,
      },
    }
  }

  return typed as ApiResponse<ProfessionalsApiResponse>
}

export async function getProfessionalAvailability(
  professionalId: number,
  filters: AvailabilityFilters = {},
): Promise<ApiResponse<ProfessionalAvailabilityEntry[]>> {
  const query = buildAvailabilityQuery(filters)
  const response = await request<unknown>(
    `/professionals/${professionalId}/availability${query}`,
  )

  if (Array.isArray(response)) {
    return {
      success: true,
      data: response as ProfessionalAvailabilityEntry[],
    }
  }

  if (!response || typeof response !== "object" || !("success" in response)) {
    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Resposta inesperada do servidor",
        statusCode: 0,
      },
    }
  }

  const typed = response as ApiResponse<
    ProfessionalAvailabilityResponse | ProfessionalAvailabilityEntry[]
  >

  if (!typed.success || !typed.data) {
    return typed as ApiResponse<ProfessionalAvailabilityEntry[]>
  }

  if (Array.isArray(typed.data)) {
    return {
      ...typed,
      data: typed.data,
    }
  }

  if (
    typed.data &&
    typeof typed.data === "object" &&
    Array.isArray((typed.data as ProfessionalAvailabilityResponse).data)
  ) {
    const payload = typed.data as ProfessionalAvailabilityResponse
    const flattened = payload.data.flatMap(day =>
      day.slots.map(slot => ({
        date: day.date,
        time: slot.time,
        is_available: slot.is_available,
        reason: slot.reason,
      })),
    )

    return {
      ...typed,
      data: flattened,
    }
  }

  return {
    success: false,
    error: {
      code: "INVALID_RESPONSE",
      message: "Resposta inesperada do servidor",
      statusCode: 0,
    },
  }
}

function buildProfessionalsQuery(filters: ProfessionalFilters) {
  const params = new URLSearchParams()

  if (filters.specialty) params.set("specialty", filters.specialty)
  if (filters.name) params.set("name", filters.name)
  if (filters.page) params.set("page", String(filters.page))
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize))

  const query = params.toString()
  return query ? `?${query}` : ""
}

function buildAvailabilityQuery(filters: AvailabilityFilters) {
  const params = new URLSearchParams()

  if (filters.startDate) params.set("startDate", filters.startDate)
  if (filters.endDate) params.set("endDate", filters.endDate)
  if (filters.daysAhead) params.set("days_ahead", String(filters.daysAhead))

  const query = params.toString()
  return query ? `?${query}` : ""
}
