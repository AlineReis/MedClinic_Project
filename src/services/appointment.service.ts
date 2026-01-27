import { Appointment, AppointmentFilters, PaginatedResult, PaginationParams } from "../models/appointment.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { AvailabilityRepository } from "../repository/availability.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../utils/errors.js";
import { AuthResult } from "../models/user.js";

export class AppointmentService {
    constructor(
        private appointmentRepository: AppointmentRepository,
        private availabilityRepository: AvailabilityRepository,
        private userRepository: UserRepository
    ) { }

    async scheduleAppointment(data: Appointment): Promise<number> {
        // Validar existência do paciente
        const patient = await this.userRepository.findById(data.patient_id);
        if (!patient) {
            throw new NotFoundError("Paciente não encontrado.");
        }

        // Validar existência do profissional
        const professional = await this.userRepository.findById(data.professional_id);
        if (!professional) {
            throw new NotFoundError("Profissional não encontrado.");
        }
        if (professional.role !== 'health_professional') {
            throw new ValidationError("O usuário informado não é um profissional de saúde.", "professional");
        }

        // Validar data no futuro
        const appointmentDateTime = new Date(`${data.date}T${data.time}`);
        // Validacao simplificada, idealmente checar fusos
        if (appointmentDateTime < new Date()) {
            throw new ValidationError("O agendamento deve ser para uma data futura.", "date");
        }

        // RN-01: Validar disponibilidade do profissional (horário deve estar em professional_availabilities)
        const dayOfWeek = appointmentDateTime.getDay(); // 0 is Sunday, 1 is Monday...

        const availabilities = await this.availabilityRepository.findByProfessionalId(data.professional_id);
        const dailyAvailability = availabilities.filter(a => a.day_of_week === dayOfWeek);

        if (dailyAvailability.length === 0) {
            throw new ValidationError("O profissional não atende neste dia da semana.", "availability");
        }

        const isWithinSlot = dailyAvailability.some(slot => {
            return data.time >= slot.start_time && data.time < slot.end_time;
        });

        if (!isWithinSlot) {
            throw new ValidationError("O horário escolhido está fora do expediente do profissional.", "availability");
        }

        // RN-02: Antecedência mínima de 2h para agendamentos presenciais
        if (data.type === 'presencial') {
            const now = new Date();
            const diffInMs = appointmentDateTime.getTime() - now.getTime();
            const twoHoursInMs = 2 * 60 * 60 * 1000;

            if (diffInMs < twoHoursInMs) {
                throw new ValidationError("Agendamentos presenciais devem ser feitos com no mínimo 2 horas de antecedência.", "date");
            }
        }

        // RN-03: Antecedência máxima de 90 dias
        const now = new Date();
        const diffInMsGeneric = appointmentDateTime.getTime() - now.getTime();
        const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;

        if (diffInMsGeneric > ninetyDaysInMs) {
            throw new ValidationError("Não é possível agendar consultas com mais de 90 dias de antecedência.", "date");
        }

        // Validar RN-04: Sem duplicação de agendamento para o mesmo paciente/profissional/dia
        const hasConflict = await this.appointmentRepository.checkConflict(
            data.patient_id,
            data.professional_id,
            data.date
        );

        if (hasConflict) {
            throw new ValidationError(
                "O paciente já possui uma consulta agendada com este profissional nesta data.",
                "conflict"
            );
        }

        // Criar agendamento
        return this.appointmentRepository.create(data);
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

    async cancelAppointment(id: number, reason: string, cancelledById: number): Promise<void> {
        const appointment = await this.getAppointmentById(id);

        if (['cancelled_by_patient', 'cancelled_by_clinic', 'completed'].includes(appointment.status || '')) {
            throw new ValidationError("Este agendamento já está cancelado ou concluído.", "status");
        }

        await this.appointmentRepository.cancel(id, reason, cancelledById);
    }

    async updatePaymentStatus(id: number, status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'): Promise<void> {
        const appointment = await this.getAppointmentById(id);
        // Pode adicionar regras de transição aqui
        await this.appointmentRepository.updatePaymentStatus(id, status);
    }
}
