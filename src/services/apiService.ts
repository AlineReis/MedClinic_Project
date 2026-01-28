type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export interface ApiError {
  code: string
  message: string
  statusCode: number
  field?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

const BASE_URL = "http://localhost:3000/api/v1/clinic-01"
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
}

export async function request<T>(
  path: string,
  method: HttpMethod = "GET",
  body?: unknown,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: DEFAULT_HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    })

    const payload = await parseResponse<T>(response)

    if (!response.ok) {
      const errorMessage = payload.error?.message ?? "Erro inesperado"
      return {
        success: false,
        error: payload.error || {
          code: `HTTP_${response.status}`,
          message: errorMessage,
          statusCode: response.status,
        },
      }
    }

    return payload
  } catch (error) {
    return handleError(error)
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? ""

  if (!contentType.includes("application/json")) {
    return {
      success: false,
      error: {
        code: `HTTP_${response.status}`,
        message: "Resposta inesperada do servidor",
        statusCode: response.status,
      },
    }
  }

  return (await response.json()) as ApiResponse<T>
}

export function handleError(error: unknown): ApiResponse<never> {
  console.error("apiService error:", error)
  return {
    success: false,
    error: {
      code: "NETWORK_ERROR",
      message: "Não foi possível conectar ao servidor",
      statusCode: 0,
    },
  }
}
