import { PrescriptionRepository } from "../repository/prescription.repository.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import {
  CreatePrescriptionPayload,
  Prescription,
} from "../models/prescription.js";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../utils/errors.js";

export class PrescriptionService {
  constructor(
    private prescriptionRepository: PrescriptionRepository,
    private appointmentRepository: AppointmentRepository,
  ) {}

  async createPrescription(
    payload: CreatePrescriptionPayload,
  ): Promise<number> {
    const appointment = await this.appointmentRepository.findById(
      payload.appointment_id,
    );
    if (!appointment) {
      throw new NotFoundError("Consulta vinculada não encontrada.");
    }

    // Validar se o profissional é o mesmo da consulta (ou se apenas médico pode)
    // Regra: Apenas médicos podem prescrever (Roles: health_professional).
    // Aqui assumimos que quem chama é o profissional logado (verificado no controller).
    // Verifica se o profissional é o mesmo agendado
    if (appointment.professional_id !== payload.professional_id) {
      throw new ForbiddenError(
        "Você só pode criar prescrições para suas próprias consultas.",
      );
    }

    return this.prescriptionRepository.create(payload);
  }

  async listPrescriptionsByContext(user: {
    id: number;
    role: string;
  }): Promise<Prescription[]> {
    if (user.role === "patient") {
      return this.prescriptionRepository.findByPatientId(user.id);
    }

    if (user.role === "health_professional") {
      // Médicos veem as que eles criaram
      return this.prescriptionRepository.findByProfessionalId(user.id);
    }

    if (
      user.role === "lab_tech" ||
      user.role === "clinic_admin" ||
      user.role === "system_admin"
    ) {
      // Admin vê todas? Ou nenhuma? Vamos assumir que não listam tudo por padrão para privacy.
      // Mas a task pode pedir "admin todos". Vamos restringir por enquanto.
      return [];
    }

    return [];
  }

  async getPrescriptionById(
    id: number,
    user: { id: number; role: string },
  ): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription) {
      throw new NotFoundError("Prescrição não encontrada.");
    }

    // Regra de Visualização
    const canAccess =
      user.role === "system_admin" ||
      user.role === "clinic_admin" ||
      prescription.patient_id === user.id ||
      prescription.professional_id === user.id;

    if (!canAccess) {
      throw new ForbiddenError(
        "Você não tem permissão para visualizar esta prescrição.",
      );
    }

    return prescription;
  }
}
