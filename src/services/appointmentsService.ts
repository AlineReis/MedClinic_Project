import type { AppointmentSummary } from "../types/appointments";
import { appointmentsCache, buildCacheKey } from "../utils/cache";
import type { ApiResponse } from "./apiService";
import { request } from "./apiService";
import { clearAvailabilityCache } from "./professionalsService";

export type AppointmentFilters = {
  patientId?: number;
  professionalId?: number;
  status?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  upcoming?: boolean;
  page?: number;
  pageSize?: number;
};

type AppointmentApiItem = {
  id: number;
  patient_id?: number;
  patient_name?: string;
  professional_id?: number;
  professional_name?: string;
  professional_specialty?: string;
  // Nested objects (for detailed responses from other endpoints)
  patient?: { id: number; name: string; email?: string; phone?: string };
  professional?: {
    id: number;
    name: string;
    specialty?: string;
    registration_number?: string;
  };
  date: string;
  time: string;
  duration_minutes?: number;
  type?: string;
  status: string;
  payment_status?: string;
  price?: number;
  room_number?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type PaginatedAppointmentsResponse = {
  data: AppointmentApiItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type AppointmentDetailResponse = {
  appointment: AppointmentApiItem;
};

export type PaginatedAppointments = {
  appointments: AppointmentSummary[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export async function listAppointments(
  filters: AppointmentFilters = {},
  useCache = true,
): Promise<ApiResponse<PaginatedAppointments>> {
  const cacheKey = buildCacheKey("appointments", {
    patientId: filters.patientId,
    professionalId: filters.professionalId,
    status: filters.status,
    date: filters.date,
    startDate: filters.startDate,
    endDate: filters.endDate,
    upcoming: filters.upcoming,
    page: filters.page,
    pageSize: filters.pageSize,
  });

  if (useCache) {
    const cached = appointmentsCache.get(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached as PaginatedAppointments,
      };
    }
  }

  const query = buildAppointmentQuery(filters);
  const response = await request<PaginatedAppointmentsResponse>(
    `/appointments${query}`,
  );

  if (!response.success || !response.data) {
    return {
      ...response,
      data: {
        appointments: [],
        pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      },
    } as ApiResponse<PaginatedAppointments>;
  }

  // Handle both paginated and non-paginated responses
  if (Array.isArray(response.data)) {
    const result = {
      appointments: response.data.map(mapAppointmentSummary),
      pagination: {
        total: response.data.length,
        page: 1,
        pageSize: response.data.length,
        totalPages: 1,
      },
    };
    appointmentsCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minute TTL for appointments
    return {
      ...response,
      data: result,
    };
  }

  const result = {
    appointments: response.data.data.map(mapAppointmentSummary),
    pagination: response.data.pagination,
  };
  appointmentsCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minute TTL for appointments
  return {
    ...response,
    data: result,
  };
}

type CreateAppointmentPayload = {
  patientId: number;
  professionalId: number;
  date: string;
  time: string;
  type: string;
  price?: number;
};

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
  };

  const response = await request<AppointmentApiItem>(
    "/appointments",
    "POST",
    body,
  );

  if (!response.success || !response.data) {
    return response as ApiResponse<AppointmentSummary>;
  }

  // Invalidate caches after successful appointment creation
  appointmentsCache.clear();
  clearAvailabilityCache(payload.professionalId);

  return {
    ...response,
    data: mapAppointmentSummary(response.data),
  };
}

type CancelAppointmentPayload = {
  reason?: string;
};

type CancelAppointmentResponse = {
  message: string;
  refund?: {
    amount: number;
    percentage: number;
  };
};

export async function cancelAppointment(
  appointmentId: number,
  { reason = "Cancelado pelo usuário" }: CancelAppointmentPayload = {},
): Promise<ApiResponse<CancelAppointmentResponse>> {
  const body = { reason };

  const response = await request<CancelAppointmentResponse>(
    `/appointments/${appointmentId}`,
    "DELETE",
    body,
  );

  if (response.success) {
    // Invalidate caches after successful cancellation
    appointmentsCache.clear();
    clearAvailabilityCache(); // Clear all availability since we don't know professional ID here
  }

  return response;
}

type RescheduleAppointmentPayload = {
  newDate: string;
  newTime: string;
};

export async function rescheduleAppointment(
  appointmentId: number,
  payload: RescheduleAppointmentPayload,
): Promise<ApiResponse<AppointmentSummary>> {
  const body = {
    new_date: payload.newDate,
    new_time: payload.newTime,
  };

  const response = await request<AppointmentApiItem>(
    `/appointments/${appointmentId}/reschedule`,
    "POST",
    body,
  );

  if (!response.success || !response.data) {
    return response as ApiResponse<AppointmentSummary>;
  }

  // Invalidate caches after successful rescheduling
  appointmentsCache.clear();
  clearAvailabilityCache(); // Clear all availability since we don't know professional ID here

  return {
    ...response,
    data: mapAppointmentSummary(response.data),
  };
}

export async function checkInAppointment(
  appointmentId: number,
): Promise<ApiResponse<{ message: string }>> {
  const response = await request<{ message: string }>(
    `/appointments/${appointmentId}/check-in`,
    "POST",
  );

  if (response.success) {
    clearAppointmentsCache();
  }

  return response;
}

export async function getAppointment(
  appointmentId: number,
): Promise<ApiResponse<AppointmentSummary>> {
  // Use 'any' to bypass strict typing because we know the backend returns 'appointment' instead of 'data'
  const response = await request<any>(`/appointments/${appointmentId}`);

  if (!response.success) {
    return {
      success: false,
      error: response.error ?? {
        code: "UNKNOWN_ERROR",
        message: "Erro desconhecido",
        statusCode: 500,
      },
    };
  }

  // Backend returns { success: true, appointment: {...} }
  // apiService passes it through. We need to grab .appointment or .data
  const rawData = response.data || (response as any).appointment;

  if (!rawData) {
    return {
      success: false,
      error: {
        code: "NO_DATA",
        message: "Dados da consulta não encontrados",
        statusCode: 404,
      },
    };
  }

  return {
    success: true,
    data: mapAppointmentSummary(rawData),
  };
}

function buildAppointmentQuery(filters: AppointmentFilters) {
  const params = new URLSearchParams();

  if (filters.patientId) params.set("patient_id", String(filters.patientId));
  if (filters.professionalId) {
    params.set("professional_id", String(filters.professionalId));
  }
  if (filters.status) params.set("status", filters.status);
  if (filters.date) params.set("date", filters.date);
  if (filters.startDate) params.set("start_date", filters.startDate);
  if (filters.endDate) params.set("end_date", filters.endDate);
  if (filters.upcoming !== undefined) {
    params.set("upcoming", String(filters.upcoming));
  }
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

  const query = params.toString();
  return query ? `?${query}` : "";
}

function mapAppointmentSummary(item: AppointmentApiItem): AppointmentSummary {
  return {
    id: item.id,
    // Prioritize flat fields from JOIN, fallback to nested objects
    patient_id: item.patient_id ?? item.patient?.id ?? 0,
    patient_name: item.patient_name ?? item.patient?.name ?? "",
    professional_id: item.professional_id ?? item.professional?.id ?? 0,
    professional_name: item.professional_name ?? item.professional?.name ?? "",
    specialty:
      item.professional_specialty ?? item.professional?.specialty ?? "",
    date: item.date,
    time: item.time,
    status: item.status,
    price: item.price,
    room: item.room_number ?? null,
    duration_minutes: item.duration_minutes,
  };
}

/**
 * Clear appointments cache
 * Call this after any appointment mutation to refresh the list
 */
export function clearAppointmentsCache(): void {
  appointmentsCache.clear();
}
