type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  field?: string;
}

declare const CLINIC_API_HOST: string | undefined;
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Determina o ambiente (Local ou Nginx/Alpha)
export const getApiUrl = () => {
  // Se a URL contém '/server03', precisamos manter esse prefixo
  const prefix = window.location.pathname.includes("/server03")
    ? "/server03"
    : "";

  return `${prefix}/api/v1/1`;
};

const BASE_URL = (CLINIC_API_HOST ?? getApiUrl()).replace(/\/+$/, "");

// Garante o ID da clínica no final (ajuste de ambiente)
const FINAL_BASE_URL = BASE_URL.endsWith("/api/v1")
  ? `${BASE_URL}/1`
  : BASE_URL;

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

export async function request<T>(
  path: string,
  method: HttpMethod = "GET",
  body?: unknown,
): Promise<ApiResponse<T>> {
  try {
    const isFormData = body instanceof FormData;

    const response = await fetch(`${FINAL_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: isFormData ? { Accept: "application/json" } : DEFAULT_HEADERS,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
      return { success: true } as ApiResponse<T>;
    }

    const payload = await parseResponse<T>(response);

    if (!response.ok) {
      if (response.status === 401) {
        // 1. Limpa o estado na Store (dispara o toast de erro)
        unauthorizedHandler?.();

        // 2. Resolve o redirecionamento com o prefixo dinâmico
        const base = window.location.pathname.includes('/server03') ? '/server03' : '';
        
        // Pequeno delay para o usuário conseguir ler o Toast antes de ser redirecionado
        setTimeout(() => {
          window.location.href = `${base}/pages/login.html`;
        }, 1500);
      }

      const errorMessage = payload.error?.message ?? "Erro inesperado";
      return {
        success: false,
        error: payload.error || {
          code: `HTTP_${response.status}`,
          message: errorMessage,
          statusCode: response.status,
        },
      };
    }

    return payload;
  } catch (error) {
    return handleError(error);
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      success: false,
      error: {
        code: `HTTP_${response.status}`,
        message: "Resposta inesperada do servidor",
        statusCode: response.status,
      },
    };
  }

  const json = await response.json();

  if (Array.isArray(json)) {
    return { success: true, data: json as T };
  }

  if (json && typeof json === "object" && !("success" in json)) {
    return { success: true, data: json as T };
  }

  return json as ApiResponse<T>;
}

export function handleError(error: unknown): ApiResponse<never> {
  console.error("apiService error:", error);
  return {
    success: false,
    error: {
      code: "NETWORK_ERROR",
      message: "Não foi possível conectar ao servidor",
      statusCode: 0,
    },
  };
}