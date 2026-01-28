import { NotFoundError } from "utils/errors.js";
import { database } from "../config/database.js";
import {
  Appointment,
  AppointmentFilters,
  PaginatedResult,
  PaginationParams,
} from "../models/appointment.js";

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
      appointment.status || "scheduled",
      appointment.price,
      appointment.payment_status || "pending",
      appointment.video_link || null,
      appointment.room_number || null,
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
  async findByProfessionalId(
    professionalId: number,
    date?: string,
  ): Promise<Appointment[]> {
    let sql = `SELECT * FROM appointments WHERE professional_id = ?`;
    const params: any[] = [professionalId];

    if (date) {
      sql += ` AND date = ?`;
      params.push(date);
    }

    sql += ` ORDER BY date, time`;

    return await database.query<Appointment>(sql, params);
  }

  // Listagem Avançada com Filtros e Paginação
  async findAll(
    filters: AppointmentFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Appointment>> {
    let baseQuery = `FROM appointments WHERE 1=1`;
    const params: any[] = [];

    // Filtros
    if (filters.status) {
      baseQuery += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters.professional_id) {
      baseQuery += ` AND professional_id = ?`;
      params.push(filters.professional_id);
    }
    if (filters.patient_id) {
      baseQuery += ` AND patient_id = ?`;
      params.push(filters.patient_id);
    }
    if (filters.date) {
      baseQuery += ` AND date = ?`;
      params.push(filters.date);
    }
    if (filters.upcoming) {
      baseQuery += ` AND date >= date('now')`;
    }
    // Opcionais extras
    if (filters.startDate) {
      baseQuery += ` AND date >= ?`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      baseQuery += ` AND date <= ?`;
      params.push(filters.endDate);
    }

    // Count Total
    const countSql = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await database.queryOne<{ total: number }>(
      countSql,
      params,
    );
    const total = countResult ? countResult.total : 0;

    // Query Dados
    let dataSql = `SELECT * ${baseQuery}`;

    // Ordenação padrão: Próximas primeiro, depois por horário
    dataSql += ` ORDER BY date ASC, time ASC`;

    // Paginação
    const offset = (pagination.page - 1) * pagination.pageSize;
    dataSql += ` LIMIT ? OFFSET ?`;
    params.push(pagination.pageSize, offset);

    const data = await database.query<Appointment>(dataSql, params);

    const totalPages = Math.ceil(total / pagination.pageSize);

    return {
      total,
      data,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
    };
  }

  // Validar RN-04 (Sem duplicação)
  // Verifica se o paciente já tem consulta com este profissional nesta data
  async checkConflict(
    patientId: number,
    professionalId: number,
    date: string,
  ): Promise<boolean> {
    const sql = `
            SELECT COUNT(*) as count FROM appointments
            WHERE patient_id = ?
            AND professional_id = ?
            AND date = ?
            AND status NOT IN ('cancelled_by_patient', 'cancelled_by_clinic', 'no_show')
        `;

    const result = await database.queryOne<{ count: number }>(sql, [
      patientId,
      professionalId,
      date,
    ]);

    return (result?.count || 0) > 0;
  }

  // Check for active appointments for a user (either as patient or professional)
  async checkActiveAppointments(userId: number): Promise<boolean> {
    const sql = `
             SELECT 1 FROM appointments
             WHERE (patient_id = ? OR professional_id = ?)
             AND status NOT IN ('cancelled_by_patient', 'cancelled_by_clinic', 'no_show', 'completed')
             LIMIT 1
        `;

    const result = await database.queryOne(sql, [userId, userId]);
    return !!result;
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
  async cancel(
    id: number,
    reason: string,
    cancelledById: number,
  ): Promise<void> {
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

  public async reschedule(
    appointmentId: number,
    date: string,
    time: string,
  ): Promise<void> {
    const sql = `
    UPDATE appointments
    SET
      date = ?,
      time = ?,
      status = 'scheduled', -- Ou 'rescheduled', dependendo da sua regra
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

    const result = await database.run(sql, [date, time, appointmentId]);

    if (result.changes === 0) {
      throw new NotFoundError("Agendamento não encontrado para reagendamento.");
    }
  }
}
