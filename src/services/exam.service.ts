import { ExamRepository } from "../repository/exam.repository.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { ResendEmailService } from "./email.service.js";
import { getExamResultReadyHtml } from "../utils/email-templates.js";
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
import type { UserRole } from "../models/user.js";

export class ExamService {
  private emailService: ResendEmailService;

  constructor(
    private examRepository: ExamRepository,
    private appointmentRepository: AppointmentRepository,
    private userRepository: UserRepository,
  ) {
    this.emailService = new ResendEmailService();
  }

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
   * RN-14 & RN-15: Release exam results
   * Only lab_tech or admin can release results
   * Sends notifications to patient and requesting professional
   */
  async releaseExamResult(
    examId: number,
    releasedBy: { id: number; role: UserRole },
  ): Promise<ExamRequest> {
    // Validate requester is lab_tech or admin
    if (
      !["lab_tech", "clinic_admin", "system_admin"].includes(releasedBy.role)
    ) {
      throw new ForbiddenError(
        "Only lab techs and admins can release exam results",
      );
    }

    // Fetch exam
    const exam = await this.examRepository.findRequestById(examId);
    if (!exam) {
      throw new NotFoundError("Exam request not found");
    }

    // Validate result exists (RN-14)
    if (!exam.result_text && !exam.result_file_url) {
      throw new ValidationError(
        "Cannot release: result has not been uploaded yet",
        "result",
      );
    }

    // Update status: ready → released
    await this.examRepository.updateStatus(examId, "released");

    // Send notifications (RN-15)
    try {
      // Fetch patient and professional info
      const patient = await this.userRepository.findById(exam.patient_id);
      const professional = await this.userRepository.findById(
        exam.requesting_professional_id,
      );

      // Get exam catalog info for name
      const catalogItem = await this.examRepository.findCatalogById(
        exam.exam_catalog_id,
      );
      const examName = catalogItem?.name || "Exame";

      // Email patient
      if (patient) {
        this.emailService
          .send({
            to: patient.email,
            subject: "Resultado de Exame Disponível - MediLux",
            html: getExamResultReadyHtml({
              recipientName: patient.name,
              examName: examName,
              isForPatient: true,
            }),
          })
          .catch((err) =>
            console.error("Failed to send exam result email to patient:", err),
          );
      }

      // Email requesting professional
      if (professional) {
        this.emailService
          .send({
            to: professional.email,
            subject: `Resultado de Exame do Paciente Disponível - ${examName}`,
            html: getExamResultReadyHtml({
              recipientName: professional.name,
              examName: examName,
              isForPatient: false,
            }),
          })
          .catch((err) =>
            console.error(
              "Failed to send exam result email to professional:",
              err,
            ),
          );
      }
    } catch (emailError) {
      // Log email errors but don't fail the release
      console.error("Error sending exam result notifications:", emailError);
    }

    // Return updated exam
    const updatedExam = await this.examRepository.findRequestById(examId);
    if (!updatedExam) {
      throw new Error("Failed to retrieve updated exam");
    }

    return updatedExam;
  }
}
