import type {
  CreateExamPayload,
  ExamCatalogItem,
  ExamDetail,
  ExamSummary,
} from "../types/exams";
import { request } from "./apiService";

type ExamApiItem = {
  id: number;
  exam_name: string;
  status: string;
  created_at: string;
  result?: string | null;
  patient_name?: string;
  urgency?: "normal" | "urgent" | "critical";
};

type ExamDetailApiItem = {
  id: number;
  patient_id: number;
  appointment_id: number;
  exam_name: string;
  status: string;
  clinical_indication: string;
  exam_price: number;
  result: string | null;
  created_at: string;
};

type CreateExamResponse = {
  id: number;
  appointment_id: number;
  patient_id: number;
  exam_name: string;
  exam_price: number;
  clinical_indication: string;
  status: string;
  created_at: string;
};

type ExamFilters = {
  patientId?: number;
};

export async function listExams(filters: ExamFilters = {}) {
  // Backend uses authenticated user context from JWT cookie, not query params
  const response = await request<ExamApiItem[]>(`/exams`);

  if (!response.success || !response.data) {
    return response;
  }

  return {
    ...response,
    data: response.data.map(mapExamSummary),
  };
}

function mapExamSummary(item: ExamApiItem): ExamSummary {
  return {
    id: item.id,
    exam_name: item.exam_name,
    status: item.status,
    created_at: item.created_at,
    result: item.result ?? null,
    patient_name: item.patient_name,
    urgency: item.urgency,
  };
}

export async function getExam(id: number) {
  const response = await request<ExamDetailApiItem>(`/exams/${id}`);

  if (!response.success || !response.data) {
    return response;
  }

  return {
    ...response,
    data: mapExamDetail(response.data),
  };
}

export async function listCatalog() {
  const response = await request<ExamCatalogItem[]>("/exams/catalog");

  if (!response.success || !response.data) {
    return response;
  }

  return {
    ...response,
    data: response.data.map((item) => ({
      ...item,
      exam_name: item.name, // Map name to exam_name for consistency
    })),
  };
}

export async function createExam(payload: CreateExamPayload) {
  const response = await request<CreateExamResponse>("/exams", "POST", {
    appointment_id: payload.appointment_id,
    patient_id: payload.patient_id,
    exam_catalog_id: payload.exam_catalog_id,
    clinical_indication: payload.clinical_indication,
    urgency: payload.urgency,
  });

  if (!response.success || !response.data) {
    return response;
  }

  return {
    ...response,
    data: mapExamDetail(response.data),
  };
}

function mapExamDetail(
  item: ExamDetailApiItem | CreateExamResponse,
): ExamDetail {
  return {
    id: item.id,
    patient_id: item.patient_id,
    appointment_id: item.appointment_id,
    exam_name: item.exam_name,
    status: item.status,
    clinical_indication: item.clinical_indication,
    exam_price: item.exam_price,
    result: "result" in item ? item.result : null,
    created_at: item.created_at,
  };
}

// Issue #506: Upload de laudo
export async function uploadExamResult(examId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return await request<{ success: boolean; message: string; file_url: string }>(
    `/exams/${examId}/upload-result`,
    "POST",
    formData,
  );
}

// Issue #506: Liberar resultado
export async function releaseExamResult(examId: number) {
  return await request<{ success: boolean; message: string }>(
    `/exams/${examId}/release-result`,
    "POST",
  );
}
