import type { ExamSummary } from "../types/exams"
import { request } from "./apiService"

type ExamApiItem = {
  id: number
  exam_name: string
  status: string
  created_at: string
  result?: string | null
}

type ExamFilters = {
  patientId?: number
}

export async function listExams(filters: ExamFilters = {}) {
  const query = buildExamQuery(filters)
  const response = await request<ExamApiItem[]>(`/exams${query}`)

  if (!response.success || !response.data) {
    return response
  }

  return {
    ...response,
    data: response.data.map(mapExamSummary),
  }
}

function buildExamQuery(filters: ExamFilters) {
  const params = new URLSearchParams()
  if (filters.patientId) params.set("patient_id", String(filters.patientId))
  const query = params.toString()
  return query ? `?${query}` : ""
}

function mapExamSummary(item: ExamApiItem): ExamSummary {
  return {
    id: item.id,
    exam_name: item.exam_name,
    status: item.status,
    created_at: item.created_at,
    result: item.result ?? null,
  }
}
