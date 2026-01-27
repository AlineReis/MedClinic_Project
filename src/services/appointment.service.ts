import { env } from "@config/config.js";
import type { AvailabilityRepository } from "@repositories/availability.repository.js";
import {
  isMinimumHoursInFuture,
  isValidDate,
  isValidTime,
  isWithinDayRange,
  isWithinMinimumHours,
} from "utils/validators.js";
import {
  Appointment,
  AppointmentFilters,
  PaginatedResult,
  PaginationParams,
  type RescheduleAppointmentInput,
} from "../models/appointment.js";
import { AuthResult } from "../models/user.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

export class AppointmentService {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private availabilityRepository: AvailabilityRepository,
  ) {}

  async scheduleAppointment(data: Appointment): Promise<number> {
    // Validar data no futuro
    const appointmentDateTime = new Date(`${data.date}T${data.time}`);
    // Validacao simplificada, idealmente checar fusos
    if (!isMinimumHoursInFuture(appointmentDateTime, 2)) {
      throw new ValidationError(
        "O agendamento deve ser para uma data futura.",
        "date",
      );
    }

    const hasConflict = await this.appointmentRepository.checkConflict(
      data.patient_id,
      data.professional_id,
      data.date,
    );

    if (hasConflict) {
      throw new ValidationError(
        "O paciente já possui uma consulta agendada com este profissional nesta data.",
        "conflict",
      );
    }

    return this.appointmentRepository.create(data);
  }

  public async reschedule(
    input: RescheduleAppointmentInput,
  ): Promise<Appointment> {
    const { requesterId, requesterRole, appointmentId, newDate, newTime } =
      input;
    const appointment =
      await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError("Agendamento não encontrado");
    }

    if (requesterRole === "patient" && appointment.patient_id !== requesterId) {
      throw new ForbiddenError(
        "Você não tem permissão para reagendar este agendamento",
      );
    }
    if (requesterRole === "health_professional") {
      throw new ForbiddenError(
        "Você não tem permissão para reagendar este agendamento",
      );
    }

    if (!isValidDate(newDate) || !isValidTime(newTime)) {
      throw new ValidationError("Data/hora inválidas", "date");
    }
    const dateTimeStr = `${newDate}T${newTime}:00`;
    const appointmentDate = new Date(dateTimeStr);
    if (!isMinimumHoursInFuture(appointmentDate, 0)) {
      throw new ValidationError("Data não pode ser no passado", "date");
    }
    const MAX_BOOKING_DAYS = 90;

    if (!isWithinDayRange(newDate, MAX_BOOKING_DAYS)) {
      throw new ValidationError("Data acima do limite de 90 dias", "date");
    }
    if (
      !isWithinMinimumHours(
        newDate,
        newTime,
        appointment.type === "presencial" ? 2 : 1,
      )
    ) {
      throw new ValidationError("Antecedência mínima não atingida", "date");
    }

    const available = await this.availabilityRepository.isProfessionalAvailable(
      appointment.professional_id,
      newDate,
      newTime,
    );
    if (!available) {
      throw new ConflictError("Horário indisponível", "time");
    }

    const isFreeReschedule = isMinimumHoursInFuture(new Date(`${appointment.date}T${appointment.time}:00`), env.RESCHEDULE_FREE_WINDOW_HOURS);
    if (!isFreeReschedule) {
      // TODO: Se o reagendamento for antes de 24 horas, cobrar R$ 30 de taxa
      console.log("IMPLEMENTAR: Cobrança de taxa de R$ 30,00 gerada.");
    }

    await this.appointmentRepository.reschedule(
      appointmentId,
      newDate,
      newTime,
    );

    return {
      ...appointment,
      date: newDate,
      time: newTime,
      payment_status: appointment.payment_status,
    };
  }

  async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError("Agendamento não encontrado.");
    }
    return appointment;
  }

  async getPatientAppointments(patientId: number): Promise<Appointment[]> {
    return this.appointmentRepository.findByPatientId(patientId);
  }

  async getProfessionalAgenda(
    professionalId: number,
    date?: string,
  ): Promise<Appointment[]> {
    return this.appointmentRepository.findByProfessionalId(
      professionalId,
      date,
    );
  }

  async listAppointments(
    filters: AppointmentFilters,
    pagination: PaginationParams,
    user: AuthResult,
  ): Promise<PaginatedResult<Appointment>> {
    // RBAC Enforcements no Service Layer (Camada extra de seguranca)
    if (user.role === "patient") {
      // Paciente SO pode ver seus proprios
      if (filters.patient_id && filters.patient_id !== user.id) {
        throw new ForbiddenError(
          "Pacientes podem apenas visualizar seus próprios agendamentos.",
        );
      }
      // Força o ID do paciente
      filters.patient_id = user.id;
    }

    if (user.role === "health_professional") {
      // Profissional SO pode ver sua propria agenda
      if (filters.professional_id && filters.professional_id !== user.id) {
        throw new ForbiddenError(
          "Profissionais podem apenas visualizar sua própria agenda.",
        );
      }
      // Força o ID do profissional
      filters.professional_id = user.id;
    }

    // Se nao for admin/recepcao, nao pode ver tudo.
    // Logica acima ja restringe, mas bom garantir.

    return this.appointmentRepository.findAll(filters, pagination);
  }

  async confirmAppointment(id: number): Promise<void> {
    const appointment = await this.getAppointmentById(id);

    if (
      appointment.status !== "scheduled" &&
      appointment.status !== "rescheduled"
    ) {
      throw new ValidationError(
        "Apenas agendamentos 'agendados' ou 'reagendados' podem ser confirmados.",
        "status",
      );
    }

    await this.appointmentRepository.updateStatus(id, "confirmed");
  }

  async cancelAppointment(
    id: number,
    reason: string,
    cancelledById: number,
  ): Promise<void> {
    const appointment = await this.getAppointmentById(id);

    if (
      ["cancelled_by_patient", "cancelled_by_clinic", "completed"].includes(
        appointment.status || "",
      )
    ) {
      throw new ValidationError(
        "Este agendamento já está cancelado ou concluído.",
        "status",
      );
    }

    await this.appointmentRepository.cancel(id, reason, cancelledById);
  }

  async updatePaymentStatus(
    id: number,
    status:
      | "pending"
      | "processing"
      | "paid"
      | "failed"
      | "refunded"
      | "partially_refunded",
  ): Promise<void> {
    const appointment = await this.getAppointmentById(id);
    // Pode adicionar regras de transição aqui
    await this.appointmentRepository.updatePaymentStatus(id, status);
  }
}
