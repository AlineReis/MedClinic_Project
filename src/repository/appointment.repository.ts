import { database } from "../config/database.js";
import { Appointment } from "../models/appointment.js";

export class AppointmentRepository {

    // Agendar consulta
    async create(appointment: Appointment): Promise<number> {
        const sql = `
            INSERT INTO appointments (
                patient_id, professional_id, date, time, duration_minutes,
                type, status, price, payment_status, video_link, room_number,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const result = await database.run(sql, [
            appointment.patient_id,
            appointment.professional_id,
            appointment.date,
            appointment.time,
            appointment.duration_minutes || 30,
            appointment.type,
            appointment.status || 'scheduled',
            appointment.price,
            appointment.payment_status || 'pending',
            appointment.video_link || null,
            appointment.room_number || null
        ]);

        return result.lastID;
    }

    // Buscar consulta por ID
    async findById(id: number): Promise<Appointment | null> {
        const sql = `SELECT * FROM appointments WHERE id = ?`;
        return await database.queryOne<Appointment>(sql, [id]);
    }

    // Buscar consultas do paciente
    async findByPatientId(patientId: number): Promise<Appointment[]> {
        const sql = `
            SELECT * FROM appointments 
            WHERE patient_id = ? 
            ORDER BY date DESC, time DESC
        `;
        return await database.query<Appointment>(sql, [patientId]);
    }

    // Buscar consultas do profissional (agenda)
    async findByProfessionalId(professionalId: number, date?: string): Promise<Appointment[]> {
        let sql = `SELECT * FROM appointments WHERE professional_id = ?`;
        const params: any[] = [professionalId];

        if (date) {
            sql += ` AND date = ?`;
            params.push(date);
        }

        sql += ` ORDER BY date, time`;

        return await database.query<Appointment>(sql, params);
    }

    // Validar RN-04 (Sem duplicação)
    // Verifica se o paciente já tem consulta com este profissional nesta data
    async checkConflict(patientId: number, professionalId: number, date: string): Promise<boolean> {
        const sql = `
            SELECT COUNT(*) as count FROM appointments
            WHERE patient_id = ? 
            AND professional_id = ? 
            AND date = ?
            AND status NOT IN ('cancelled_by_patient', 'cancelled_by_clinic', 'no_show')
        `;

        const result = await database.queryOne<{ count: number }>(sql, [patientId, professionalId, date]);
        return result ? result.count > 0 : false;
    }

    // Atualizar status
    async updateStatus(id: number, status: string): Promise<void> {
        const sql = `
            UPDATE appointments 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        await database.run(sql, [status, id]);
    }

    // Atualizar status de pagamento
    async updatePaymentStatus(id: number, paymentStatus: string): Promise<void> {
        const sql = `
            UPDATE appointments 
            SET payment_status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        await database.run(sql, [paymentStatus, id]);
    }

    // Cancelar consulta
    async cancel(id: number, reason: string, cancelledById: number): Promise<void> {
        const sql = `
            UPDATE appointments
            SET status = 'cancelled_by_patient', 
                cancellation_reason = ?, 
                cancelled_by = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await database.run(sql, [reason, cancelledById, id]);
    }
}
