import type {
  CreateExamPayload,
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
  const query = buildExamQuery(filters);
  const response = await request<ExamApiItem[]>(`/exams${query}`);

  if (!response.success || !response.data) {
    return response;
  }

  return {
    ...response,
    data: response.data.map(mapExamSummary),
  };
}

function buildExamQuery(filters: ExamFilters) {
  const params = new URLSearchParams();
  if (filters.patientId) params.set("patient_id", String(filters.patientId));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function mapExamSummary(item: ExamApiItem): ExamSummary {
  return {
    id: item.id,
    exam_name: item.exam_name,
    status: item.status,
    created_at: item.created_at,
    result: item.result ?? null,
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

export async function createExam(payload: CreateExamPayload) {
  const response = await request<CreateExamResponse>("/exams", "POST", {
    appointment_id: payload.appointment_id,
    patient_id: payload.patient_id,
    exam_name: payload.exam_name,
    exam_price: payload.exam_price,
    clinical_indication: payload.clinical_indication,
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
