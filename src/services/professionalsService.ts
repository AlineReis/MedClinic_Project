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

// ============ Cache System ============

type CacheEntry<T> = {
  data: T
  timestamp: number
  expiresAt: number
}

const CACHE_TTL = {
  professionals: 5 * 60 * 1000, // 5 minutos
  availability: 2 * 60 * 1000,  // 2 minutos (slots mudam mais frequentemente)
}

const professionalsCache = new Map<string, CacheEntry<ProfessionalsApiResponse>>()
const availabilityCache = new Map<string, CacheEntry<ProfessionalAvailabilityEntry[]>>()

function getCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&")
  return `${prefix}:${sorted}`
}

function isExpired<T>(entry: CacheEntry<T> | undefined): boolean {
  if (!entry) return true
  return Date.now() > entry.expiresAt
}

export function clearProfessionalsCache(): void {
  professionalsCache.clear()
}

export function clearAvailabilityCache(professionalId?: number): void {
  if (professionalId) {
    const prefix = `availability:${professionalId}`
    for (const key of availabilityCache.keys()) {
      if (key.startsWith(prefix)) {
        availabilityCache.delete(key)
      }
    }
  } else {
    availabilityCache.clear()
  }
}

export function clearAllCaches(): void {
  professionalsCache.clear()
  availabilityCache.clear()
}

export async function listProfessionals(
  filters: ProfessionalFilters = {},
  options: { skipCache?: boolean } = {},
): Promise<ApiResponse<ProfessionalsApiResponse>> {
  const cacheKey = getCacheKey("professionals", filters)

  // Check cache first
  if (!options.skipCache) {
    const cached = professionalsCache.get(cacheKey)
    if (!isExpired(cached)) {
      return { success: true, data: cached!.data }
    }
  }

  const query = buildProfessionalsQuery(filters)
  const response = await request<unknown>(`/professionals${query}`)

  let result: ApiResponse<ProfessionalsApiResponse>

  if (Array.isArray(response)) {
    result = {
      success: true,
      data: {
        data: response as ProfessionalSummary[],
      },
    }
  } else if (!response || typeof response !== "object" || !("success" in response)) {
    result = {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Resposta inesperada do servidor",
        statusCode: 0,
      },
    }
  } else {
    const typed = response as ApiResponse<
      ProfessionalsApiResponse | ProfessionalSummary[]
    >

    if (!typed.success || !typed.data) {
      result = typed as ApiResponse<ProfessionalsApiResponse>
    } else if (Array.isArray(typed.data)) {
      result = {
        ...typed,
        data: {
          data: typed.data,
        },
      }
    } else {
      result = typed as ApiResponse<ProfessionalsApiResponse>
    }
  }

  // Store in cache if successful
  if (result.success && result.data) {
    professionalsCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_TTL.professionals,
    })
  }

  return result
}

export async function getProfessionalAvailability(
  professionalId: number,
  filters: AvailabilityFilters = {},
  options: { skipCache?: boolean } = {},
): Promise<ApiResponse<ProfessionalAvailabilityEntry[]>> {
  const cacheKey = getCacheKey(`availability:${professionalId}`, filters)

  // Check cache first
  if (!options.skipCache) {
    const cached = availabilityCache.get(cacheKey)
    if (!isExpired(cached)) {
      return { success: true, data: cached!.data }
    }
  }

  const query = buildAvailabilityQuery(filters)
  const response = await request<unknown>(
    `/professionals/${professionalId}/availability${query}`,
  )

  let result: ApiResponse<ProfessionalAvailabilityEntry[]>

  if (Array.isArray(response)) {
    result = {
      success: true,
      data: response as ProfessionalAvailabilityEntry[],
    }
  } else if (!response || typeof response !== "object" || !("success" in response)) {
    result = {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Resposta inesperada do servidor",
        statusCode: 0,
      },
    }
  } else {
    const typed = response as ApiResponse<
      ProfessionalAvailabilityResponse | ProfessionalAvailabilityEntry[]
    >

    if (!typed.success || !typed.data) {
      result = typed as ApiResponse<ProfessionalAvailabilityEntry[]>
    } else if (Array.isArray(typed.data)) {
      result = {
        ...typed,
        data: typed.data,
      }
    } else if (
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
      result = {
        ...typed,
        data: flattened,
      }
    } else {
      result = {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "Resposta inesperada do servidor",
          statusCode: 0,
        },
      }
    }
  }

  // Store in cache if successful
  if (result.success && result.data) {
    availabilityCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_TTL.availability,
    })
  }

  return result
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
