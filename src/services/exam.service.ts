import { ExamRepository } from "../repository/exam.repository.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import {
  CreateExamRequestPayload,
  ExamCatalog,
  ExamRequest,
} from "../models/exam.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../utils/errors.js";

export class ExamService {
  constructor(
    private examRepository: ExamRepository,
    private appointmentRepository: AppointmentRepository,
  ) {}

  async listCatalog(): Promise<ExamCatalog[]> {
    return this.examRepository.findAllCatalog();
  }

  async createRequest(payload: CreateExamRequestPayload): Promise<number> {
    const appointment = await this.appointmentRepository.findById(
      payload.appointment_id,
    );
    if (!appointment) {
      throw new NotFoundError("Consulta vinculada não encontrada.");
    }

    // Validar se o profissional solicitante é o mesmo da consulta (RN-09/10)
    // Regra de segurança: Apenas o médico da consulta deveria pedir exames para ela?
    // Ou qualquer médico pode pedir? O texto diz "Requesting professional".
    // Vamos assumir que deve ser um professional válido.

    // Validar Catálogo e Obter Preço
    const catalogItem = await this.examRepository.findCatalogById(
      payload.exam_catalog_id,
    );
    if (!catalogItem) {
      throw new ValidationError(
        "Exame não encontrado no catálogo.",
        "exam_catalog_id",
      );
    }
    if (!catalogItem.is_active) {
      throw new ValidationError(
        "Este exame não está mais disponível.",
        "exam_catalog_id",
      );
    }

    // Preparar payload com preço congelado
    const requestData = {
      ...payload,
      price: catalogItem.base_price, // Congela o preço
      status: "pending_payment" as const,
      payment_status: "pending" as const,
      urgency: payload.urgency || "normal",
    };

    return this.examRepository.createRequest(requestData);
  }

  async listRequestsByContext(user: {
    id: number;
    role: string;
  }): Promise<ExamRequest[]> {
    if (user.role === "patient") {
      return this.examRepository.findRequestsByPatientId(user.id);
    }

    if (user.role === "health_professional") {
      return this.examRepository.findRequestsByProfessionalId(user.id);
    }

    if (
      user.role === "lab_tech" ||
      user.role === "clinic_admin" ||
      user.role === "system_admin"
    ) {
      return this.examRepository.findAllRequests();
    }

    return [];
  }

  async getRequestById(
    id: number,
    user: { id: number; role: string },
  ): Promise<ExamRequest> {
    const request = await this.examRepository.findRequestById(id);
    if (!request) {
      throw new NotFoundError("Exame não encontrado.");
    }

    // Regra de Visualização (RN-13)
    // Pode ver: Paciente dono, Médico solicitante, Admin, Lab Tech
    const canAccess =
      user.role === "system_admin" ||
      user.role === "clinic_admin" ||
      user.role === "lab_tech" ||
      request.patient_id === user.id ||
      request.requesting_professional_id === user.id;

    if (!canAccess) {
      throw new ForbiddenError(
        "Você não tem permissão para visualizar este exame.",
      );
    }

    return request;
  }

  /**
   * Phase 5: Schedule exam collection
   * paid_pending_schedule → scheduled
   */
  async scheduleExam(
    id: number,
    scheduledDate: string,
    user: { id: number; role: string },
  ): Promise<void> {
    const request = await this.examRepository.findRequestById(id);
    if (!request) {
      throw new NotFoundError("Exame não encontrado.");
    }

    // Only lab_tech or admins can schedule exams
    if (!["lab_tech", "clinic_admin", "system_admin"].includes(user.role)) {
      throw new ForbiddenError(
        "Apenas técnicos de laboratório ou administradores podem agendar coletas.",
      );
    }

    // Validate current status
    if (request.status !== "paid") {
      throw new ValidationError(
        "Apenas exames pagos podem ser agendados.",
        "status",
      );
    }

    // Validate scheduled date is in future
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime <= new Date()) {
      throw new ValidationError(
        "A data agendada deve ser no futuro.",
        "scheduled_date",
      );
    }

    // Update request with scheduled date and status
    await this.examRepository.updateScheduledDate(id, scheduledDate);
    await this.examRepository.updateStatus(id, "scheduled");
  }

  /**
   * Phase 5: Download exam result
   * Returns result_file_url or result_text
   */
  async downloadResult(
    id: number,
    user: { id: number; role: string },
  ): Promise<{ result_file_url?: string; result_text?: string }> {
    const request = await this.getRequestById(id, user); // Uses existing RBAC

    // Validate result exists
    if (!request.result_file_url && !request.result_text) {
      throw new NotFoundError("Resultado do exame ainda não está disponível.");
    }

    // Validate status allows download
    if (!["ready", "delivered"].includes(request.status)) {
      throw new ValidationError(
        "O resultado do exame ainda não foi liberado.",
        "status",
      );
    }

    return {
      result_file_url: request.result_file_url,
      result_text: request.result_text,
    };
  }

  /**
   * Issue #506: Upload de laudo
   */
  async uploadResult(
    examId: number,
    fileUrl: string,
    user: { id: number; role: string },
  ): Promise<void> {
    // RN-14: Apenas lab_tech, clinic_admin ou system_admin pode fazer upload
    if (!["lab_tech", "clinic_admin", "system_admin"].includes(user.role)) {
      throw new ForbiddenError(
        "Apenas técnicos de laboratório ou administradores podem enviar laudos.",
      );
    }

    const exam = await this.examRepository.findRequestById(examId);
    if (!exam) {
      throw new NotFoundError("Exame não encontrado.");
    }

    // Validar que o exame não está cancelado
    if (exam.status === "cancelled") {
      throw new ValidationError(
        "Não é possível enviar laudo para exame cancelado.",
        "status",
      );
    }

    await this.examRepository.updateResultFile(examId, fileUrl, user.id);
  }

  /**
   * Issue #506: Liberar resultado para paciente
   */
  async releaseResult(
    examId: number,
    user: { id: number; role: string },
  ): Promise<void> {
    const exam = await this.examRepository.findRequestById(examId);
    if (!exam) {
      throw new NotFoundError("Exame não encontrado.");
    }

    // RN-14: Pode liberar: lab_tech, médico solicitante, admin
    const canRelease =
      user.role === "system_admin" ||
      user.role === "clinic_admin" ||
      user.role === "lab_tech" ||
      exam.requesting_professional_id === user.id;

    if (!canRelease) {
      throw new ForbiddenError(
        "Você não tem permissão para liberar este resultado.",
      );
    }

    // Validar que há resultado (PDF ou texto)
    if (!exam.result_file_url && !exam.result_text) {
      throw new ValidationError(
        "Não é possível liberar resultado sem laudo anexado.",
        "result",
      );
    }

    await this.examRepository.releaseResult(examId);
  }
}
