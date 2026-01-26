import { Appointment } from "../models/appointment.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

export class AppointmentService {
    constructor(private appointmentRepository: AppointmentRepository) { }

    async scheduleAppointment(data: Appointment): Promise<number> {
        // Validar data no futuro
        const appointmentDateTime = new Date(`${data.date}T${data.time}`);
        if (appointmentDateTime < new Date()) {
            throw new ValidationError("O agendamento deve ser para uma data futura.", "date");
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
        // O preço deve ser passado congelado (frontend/controller deve enviar ou obter antes)
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
