import { authStore } from "../stores/authStore";
import { request, type ApiResponse } from "./apiService";

export interface CreatePatientPayload {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  password?: string;
  role: "patient";
}

export interface PatientSummary {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  created_at?: string;
}

export async function createPatient(
  payload: CreatePatientPayload,
): Promise<ApiResponse<PatientSummary>> {
  const session = authStore.getSession();
  if (!session?.clinic_id) {
    return {
      success: false,
      error: {
        code: "SESSION_ERROR",
        message: "Clinic ID missing from session",
        statusCode: 400,
      },
    };
  }

  try {
    const response = await request<any>(`/users`, "POST", payload);
    if (response.success && (response as any).user) {
      return { success: true, data: (response as any).user };
    }
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error.response?.data?.message || "Failed to create patient",
        statusCode: 500,
      },
    };
  }
}

export async function searchPatients(
  query: string,
): Promise<ApiResponse<PatientSummary[]>> {
  const session = authStore.getSession();
  if (!session?.clinic_id) {
    return {
      success: false,
      error: { code: "SESSION_ERROR", message: "No session", statusCode: 401 },
    };
  }

  // Controller listByClinic uses: req.query.search
  // GET /clinics/:id/users?role=patient&search=...
  const response = await request<any>(
    `/users?role=patient&search=${encodeURIComponent(query)}&pageSize=10`,
  );

  if (response.success) {
    const raw = response.data || (response as any).users;
    if (raw) {
      const items = raw.items || raw.users?.items || raw;
      return { success: true, data: Array.isArray(items) ? items : [] };
    }
  }

  return {
    success: false,
    error: response.error || {
      code: "FETCH_ERROR",
      message: "Failed to fetch patients",
      statusCode: 500,
    },
  };
}

export async function getPatient(
  id: number,
): Promise<ApiResponse<PatientSummary>> {
  const session = authStore.getSession();
  if (!session?.clinic_id) {
    return {
      success: false,
      error: { code: "SESSION_ERROR", message: "No session", statusCode: 401 },
    };
  }

  const response = await request<any>(`/users/${id}`);
  if (response.success && (response as any).user) {
    return { success: true, data: (response as any).user };
  }
  return response;
}

export async function updatePatient(
  id: number,
  payload: Partial<CreatePatientPayload>,
): Promise<ApiResponse<PatientSummary>> {
  const session = authStore.getSession();
  if (!session?.clinic_id) {
    return {
      success: false,
      error: { code: "SESSION_ERROR", message: "No session", statusCode: 401 },
    };
  }

  const response = await request<any>(`/users/${id}`, "PUT", payload);
  if (response.success && (response as any).user) {
    return { success: true, data: (response as any).user };
  }
  return response;
}

export async function deletePatient(id: number): Promise<ApiResponse<void>> {
  const session = authStore.getSession();
  if (!session?.clinic_id) {
    return {
      success: false,
      error: { code: "SESSION_ERROR", message: "No session", statusCode: 401 },
    };
  }

  return await request<void>(`/users/${id}`, "DELETE");
}
