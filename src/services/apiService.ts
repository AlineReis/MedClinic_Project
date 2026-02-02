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

// Determines if we are running locally or in production
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// In production, we use relative path "/api/v1/1" so Nginx can proxy it.
// Locally, we point directly to localhost:3000.
const DEFAULT_API_URL = isLocal 
  ? "http://localhost:3000/api/v1/1" 
  : "/api/v1/1";

const BASE_URL = (CLINIC_API_HOST ?? DEFAULT_API_URL).replace(
  /\/+$/,
  "",
);

// Safety patch: Ensure we have the clinic ID (temp fix for environment issues)
const FINAL_BASE_URL = BASE_URL.endsWith('/api/v1') ? `${BASE_URL}/1` : BASE_URL;
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
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
      return {
        success: true,
      } as ApiResponse<T>;
    }

    const payload = await parseResponse<T>(response);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        unauthorizedHandler?.();
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

  // Backend may return raw data (arrays or objects) without {success, data} wrapper
  // Detect and wrap them
  if (Array.isArray(json)) {
    return {
      success: true,
      data: json as T,
    };
  }

  // If it's a plain object without a 'success' field, it's raw data from backend
  if (json && typeof json === "object" && !("success" in json)) {
    return {
      success: true,
      data: json as T,
    };
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
