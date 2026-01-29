import type { ProfessionalSummary } from "../types/professionals"
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

export async function listProfessionals(
  filters: ProfessionalFilters = {},
): Promise<ApiResponse<ProfessionalsApiResponse>> {
  const query = buildProfessionalsQuery(filters)
  return request<ProfessionalsApiResponse>(`/professionals${query}`)
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
