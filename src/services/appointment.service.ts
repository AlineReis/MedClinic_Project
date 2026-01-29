import { env } from "@config/config.js";
import { isMinimumHoursInFuture, isValidDate, isValidTime, isWithinDayRange, isWithinMinimumHours, isNotSunday, isValid50MinuteSlot } from "utils/validators.js";
import { Appointment, AppointmentFilters, PaginatedResult, PaginationParams, type RescheduleAppointmentInput } from "../models/appointment.js";
import { AuthResult } from "../models/user.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { AvailabilityRepository } from "../repository/availability.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { PaymentMockService } from "./payment-mock.service.js";
import { ResendEmailService } from "./email.service.js";
import { getAppointmentEmailHtml } from "../utils/email-templates.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../utils/errors.js";

export class AppointmentService {
    constructor(
        private appointmentRepository: AppointmentRepository,
        private availabilityRepository: AvailabilityRepository,
        private userRepository: UserRepository,
        private paymentMockService: PaymentMockService,
        private emailService: ResendEmailService
    ) { }

    async scheduleAppointment(data: Appointment, cardDetails?: any): Promise<{ id: number, invoice?: any, payment_status?: string, message?: string }> {
        // ... (validations remain the same) ...
        // Validar existência do paciente
        const patient = await this.userRepository.findById(data.patient_id);
        if (!patient) throw new NotFoundError("Paciente não encontrado.");

        // Validar existência do profissional
        const professional = await this.userRepository.findById(data.professional_id);
        if (!professional) throw new NotFoundError("Profissional não encontrado.");
        if (professional.role !== 'health_professional') throw new ValidationError("O usuário informado não é um profissional de saúde.", "professional");

        // RN-Phase4: Validate no appointments on Sunday
        if (!isNotSunday(data.date)) {
            throw new ValidationError("Agendamentos não podem ser feitos aos domingos.", "date");
        }

        // RN-Phase4: Validate 50-minute time slots
        if (!isValid50MinuteSlot(data.time)) {
            throw new ValidationError("O horário deve estar em intervalos de 50 minutos (ex: 09:00, 09:50, 10:40).", "time");
        }

        // Validar data no futuro
        const appointmentDateTime = new Date(`${data.date}T${data.time}`);
        if (appointmentDateTime < new Date()) throw new ValidationError("O agendamento deve ser para uma data futura.", "date");

        // RN-01: Disponibilidade
        const dayOfWeek = appointmentDateTime.getDay();
        const availabilities = await this.availabilityRepository.findByProfessionalId(data.professional_id);
        const dailyAvailability = availabilities.filter(a => a.day_of_week === dayOfWeek);

        if (dailyAvailability.length === 0) throw new ValidationError("O profissional não atende neste dia da semana.", "availability");

        const isWithinSlot = dailyAvailability.some(slot => data.time >= slot.start_time && data.time < slot.end_time);
        if (!isWithinSlot) throw new ValidationError("O horário escolhido está fora do expediente do profissional.", "availability");

        // RN-02: 2h antecedência
        if (data.type === 'presencial') {
            const diffInMs = appointmentDateTime.getTime() - new Date().getTime();
            if (diffInMs < 2 * 60 * 60 * 1000) throw new ValidationError("Agendamentos presenciais devem ser feitos com no mínimo 2 horas de antecedência.", "date");
        }

        // RN-03: 90 dias
        const diffInMsGeneric = appointmentDateTime.getTime() - new Date().getTime();
        if (diffInMsGeneric > 90 * 24 * 60 * 60 * 1000) throw new ValidationError("Não é possível agendar consultas com mais de 90 dias de antecedência.", "date");

        // RN-04: Conflito
        const hasConflict = await this.appointmentRepository.checkConflict(data.patient_id, data.professional_id, data.date);
        if (hasConflict) throw new ValidationError("O paciente já possui uma consulta agendada com este profissional nesta data.", "conflict");

        // Criar agendamento (Status scheduled, Payment pending defaults logic in Repo)
        const appointmentId = await this.appointmentRepository.create(data);

        // Enviar Email de Confirmação (Assíncrono - não trava o response)
        // TODO: Mover para um Queue no futuro
        if (patient && patient.email) {
            const emailHtml = getAppointmentEmailHtml({
                patientName: patient.name,
                doctorName: professional.name, // Assumindo que professional tem name
                date: data.date,
                time: data.time,
                type: data.type,
                cancelLink: `https://medilux.com/appointments/${appointmentId}`, // Mock
                confirmLink: `https://medilux.com/confirm?id=${appointmentId}`   // Mock
            });

            this.emailService.send({
                to: patient.email,
                subject: "Confirmação de Agendamento - MediLux 🏥",
                html: emailHtml
            }).catch(err => console.error("❌ Erro ao enviar email de confirmação:", err));
        }

        // Process Payment if card details provided
        if (cardDetails) {
            const paymentResult = await this.paymentMockService.processAppointmentPayment(appointmentId, cardDetails);
            
            return {
                id: appointmentId,
                invoice: paymentResult.invoice,
                payment_status: paymentResult.success ? 'paid' : 'failed',
                message: paymentResult.message
            };
        }

        return { id: appointmentId, message: "Agendado com sucesso (Pagamento pendente)" };
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

    async getProfessionalAgenda(professionalId: number, date?: string): Promise<Appointment[]> {
        return this.appointmentRepository.findByProfessionalId(professionalId, date);
    }

    async listAppointments(
        filters: AppointmentFilters,
        pagination: PaginationParams,
        user: AuthResult
    ): Promise<PaginatedResult<Appointment>> {

        // RBAC Enforcements no Service Layer (Camada extra de seguranca)
        if (user.role === 'patient') {
            // Paciente SO pode ver seus proprios
            if (filters.patient_id && filters.patient_id !== user.id) {
                throw new ForbiddenError("Pacientes podem apenas visualizar seus próprios agendamentos.");
            }
            // Força o ID do paciente
            filters.patient_id = user.id;
        }

        if (user.role === 'health_professional') {
            // Profissional SO pode ver sua propria agenda
            if (filters.professional_id && filters.professional_id !== user.id) {
                throw new ForbiddenError("Profissionais podem apenas visualizar sua própria agenda.");
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

        if (appointment.status !== 'scheduled' && appointment.status !== 'rescheduled') {
            throw new ValidationError("Apenas agendamentos 'agendados' ou 'reagendados' podem ser confirmados.", "status");
        }

        await this.appointmentRepository.updateStatus(id, 'confirmed');
    }

    async cancelAppointment(id: number, reason: string, cancelledById: number): Promise<{ message: string, refundDetails?: any }> {
        const appointment = await this.getAppointmentById(id);

        if (['cancelled_by_patient', 'cancelled_by_clinic', 'completed'].includes(appointment.status || '')) {
            throw new ValidationError("Este agendamento já está cancelado ou concluído.", "status");
        }

        await this.appointmentRepository.cancel(id, reason, cancelledById);

        // Process Refund Automatically if Paid
        if (appointment.payment_status === 'paid') {
            const refundResult = await this.paymentMockService.processRefund(id);
            return {
                message: "Consulta cancelada com sucesso.",
                refundDetails: refundResult
            };
        }

        return { message: "Consulta cancelada com sucesso." };
    }

    async updatePaymentStatus(id: number, status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'): Promise<void> {
        const appointment = await this.getAppointmentById(id);
        // Pode adicionar regras de transição aqui
        await this.appointmentRepository.updatePaymentStatus(id, status);
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

    // RN-Phase4: Validate no appointments on Sunday
    if (!isNotSunday(newDate)) {
      throw new ValidationError("Agendamentos não podem ser feitos aos domingos.", "date");
    }

    // RN-Phase4: Validate 50-minute time slots
    if (!isValid50MinuteSlot(newTime)) {
      throw new ValidationError("O horário deve estar em intervalos de 50 minutos (ex: 09:00, 09:50, 10:40).", "time");
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
}
