import type { ApiError } from "../services/apiService"

/**
 * Maps API error codes to user-friendly messages for appointment operations.
 * Based on RN (Regras de Negócio) documented in docs/DOC_API_ROTAS.md
 */
export function mapAppointmentError(error: ApiError): string {
  switch (error.code) {
    // RN-01: Slot availability
    case "SLOT_NOT_AVAILABLE":
      return "Este horário não está mais disponível. Por favor, escolha outro horário."

    // RN-02: Minimum notice requirement (2 hours for presencial)
    case "INSUFFICIENT_NOTICE":
      return "Antecedência mínima não atingida. Consultas presenciais requerem pelo menos 2 horas de antecedência."

    // RN-03: Duplicate appointment prevention
    case "DUPLICATE_APPOINTMENT":
      return error.message || "Você já possui um agendamento com este profissional nesta data."

    // Reschedule-specific: new slot not available
    case "NEW_SLOT_NOT_AVAILABLE":
      return "O novo horário selecionado não está disponível. Por favor, escolha outro."

    // Cancellation-specific: cannot cancel completed/cancelled appointments
    case "CANNOT_CANCEL":
      return error.message || "Não é possível cancelar este agendamento."

    // Generic appointment errors
    case "APPOINTMENT_NOT_FOUND":
      return "Agendamento não encontrado."

    case "FORBIDDEN":
      return "Você não tem permissão para realizar esta ação."

    // Network and server errors
    case "NETWORK_ERROR":
      return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."

    // Fallback to backend message or generic error
    default:
      return error.message || "Não foi possível processar sua solicitação. Tente novamente."
  }
}

/**
 * Maps generic API errors to user-friendly messages
 */
export function mapGenericError(error: ApiError): string {
  switch (error.code) {
    case "EMAIL_ALREADY_EXISTS":
      return "Este email já está registrado no sistema."

    case "USER_NOT_FOUND":
      return "Usuário não encontrado."

    case "INVALID_CREDENTIALS":
      return "Email ou senha incorretos."

    case "INVALID_INPUT":
      return error.message || "Dados inválidos fornecidos."

    case "FORBIDDEN":
      return "Você não tem permissão para acessar este recurso."

    case "NETWORK_ERROR":
      return "Não foi possível conectar ao servidor. Verifique sua conexão."

    default:
      return error.message || "Ocorreu um erro inesperado. Tente novamente."
  }
}
