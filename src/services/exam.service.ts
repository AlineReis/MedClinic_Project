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
}
