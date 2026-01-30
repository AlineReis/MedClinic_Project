import type {
  AvailabilityInput,
  CommissionsResponse,
  CreateAvailabilityResponse,
  ProfessionalAvailabilityEntry,
  ProfessionalAvailabilityResponse,
  ProfessionalSummary,
} from "../types/professionals"
import {
  availabilityCache,
  buildCacheKey,
  professionalsCache,
} from "../utils/cache"
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

type CommissionsFilters = {
  month?: number
  year?: number
  status?: "pending" | "paid"
}

export async function listProfessionals(
  filters: ProfessionalFilters = {},
  useCache = true,
): Promise<ApiResponse<ProfessionalsApiResponse>> {
  const cacheKey = buildCacheKey("professionals", {
    specialty: filters.specialty,
    name: filters.name,
    page: filters.page,
    pageSize: filters.pageSize,
  })

  if (useCache) {
    const cached = professionalsCache.get(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached as ProfessionalsApiResponse,
      }
    }
  }

  const query = buildProfessionalsQuery(filters)
  const response = await request<unknown>(`/professionals${query}`)

  if (Array.isArray(response)) {
    const result = {
      success: true,
      data: {
        data: response as ProfessionalSummary[],
      },
    }
    professionalsCache.set(cacheKey, result.data)
    return result
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
    const result = {
      ...typed,
      data: {
        data: typed.data,
      },
    }
    professionalsCache.set(cacheKey, result.data)
    return result
  }

  const result = typed as ApiResponse<ProfessionalsApiResponse>
  if (result.success && result.data) {
    professionalsCache.set(cacheKey, result.data)
  }
  return result
}

export async function getProfessionalAvailability(
  professionalId: number,
  filters: AvailabilityFilters = {},
  useCache = true,
): Promise<ApiResponse<ProfessionalAvailabilityEntry[]>> {
  const cacheKey = buildCacheKey(`availability:${professionalId}`, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    daysAhead: filters.daysAhead,
  })

  if (useCache) {
    const cached = availabilityCache.get(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached,
      }
    }
  }

  const query = buildAvailabilityQuery(filters)
  const response = await request<unknown>(
    `/professionals/${professionalId}/availability${query}`,
  )

  if (Array.isArray(response)) {
    const data = response as ProfessionalAvailabilityEntry[]
    availabilityCache.set(cacheKey, data)
    return {
      success: true,
      data,
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
    availabilityCache.set(cacheKey, typed.data)
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

    availabilityCache.set(cacheKey, flattened)
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

export async function getProfessionalCommissions(
  professionalId: number,
  filters: CommissionsFilters = {},
): Promise<ApiResponse<CommissionsResponse>> {
  const query = buildCommissionsQuery(filters)
  const response = await request<CommissionsResponse>(
    `/professionals/${professionalId}/commissions${query}`,
  )

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

  return response as ApiResponse<CommissionsResponse>
}

export async function createProfessionalAvailability(
  professionalId: number,
  availabilities: AvailabilityInput[],
): Promise<ApiResponse<CreateAvailabilityResponse>> {
  const response = await request<CreateAvailabilityResponse>(
    `/professionals/${professionalId}/availability`,
    "POST",
    { availabilities },
  )

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

  // Clear availability cache after creating new availability
  clearAvailabilityCache(professionalId)

  return response as ApiResponse<CreateAvailabilityResponse>
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

  if (filters.startDate) params.set("date", filters.startDate)
  if (filters.endDate) params.set("endDate", filters.endDate)
  if (filters.daysAhead) params.set("days_ahead", String(filters.daysAhead))

  const query = params.toString()
  return query ? `?${query}` : ""
}

function buildCommissionsQuery(filters: CommissionsFilters) {
  const params = new URLSearchParams()

  if (filters.month) params.set("month", String(filters.month))
  if (filters.year) params.set("year", String(filters.year))
  if (filters.status) params.set("status", filters.status)

  const query = params.toString()
  return query ? `?${query}` : ""
}

/**
 * Clear professionals list cache
 * Call this after creating/updating/deleting professionals
 */
export function clearProfessionalsCache(): void {
  professionalsCache.clear()
}

/**
 * Clear availability cache for a specific professional
 * Call this after booking/canceling/rescheduling appointments
 * @param professionalId Optional professional ID to clear specific cache
 */
export function clearAvailabilityCache(professionalId?: number): void {
  if (professionalId !== undefined) {
    const keysToDelete: string[] = []
    availabilityCache["cache"].forEach((_, key) => {
      if (key.startsWith(`availability:${professionalId}`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => availabilityCache.delete(key))
  } else {
    availabilityCache.clear()
  }
}

export type {
  AvailabilityFilters,
  CommissionsFilters,
  ProfessionalFilters,
  ProfessionalsApiResponse
}
