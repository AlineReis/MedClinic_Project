import { Appointment, AppointmentFilters, PaginatedResult, PaginationParams } from "../models/appointment.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { AvailabilityRepository } from "../repository/availability.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/errors.js";
import { AuthResult } from "../models/user.js";
import { PaymentMockService } from "./payment-mock.service.js";

export class AppointmentService {
    constructor(
        private appointmentRepository: AppointmentRepository,
        private availabilityRepository: AvailabilityRepository,
        private userRepository: UserRepository,
        private paymentMockService: PaymentMockService
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
}
