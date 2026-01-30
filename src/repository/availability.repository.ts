import { database } from "../config/database.js";
import { Availability } from "../models/professional.model.js";

export class AvailabilityRepository {
  async create(avail: Availability): Promise<number> {
    const sql = `
      INSERT INTO availabilities (professional_id, day_of_week, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `;
    const result = await database.run(sql, [
      avail.professional_id,
      avail.day_of_week,
      avail.start_time,
      avail.end_time,
    ]);
    return result.lastID;
  }

  async findByProfessionalId(professionalId: number): Promise<Availability[]> {
    const sql = `
      SELECT * FROM availabilities
      WHERE professional_id = ? AND is_active = 1
      ORDER BY day_of_week, start_time
    `;
    return await database.query<Availability>(sql, [professionalId]);
  }

  async deleteByProfessionalId(professionalId: number): Promise<void> {
    const sql = `DELETE FROM availabilities WHERE professional_id = ?`;
    await database.run(sql, [professionalId]);
  }

  async deleteById(id: number, professionalId: number): Promise<void> {
    const sql = `DELETE FROM availabilities WHERE id = ? AND professional_id = ?`;
    await database.run(sql, [id, professionalId]);
  }

  public async isProfessionalAvailable(
    professionalId: number,
    date: string,
    time: string,
  ): Promise<boolean> {
    const [year, month, day] = date.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const sql = `
        SELECT
            avail.id
        FROM availabilities avail
        WHERE
            -- PARTE 1: Verificar se existe grade de trabalho ativa para este horário
            avail.professional_id = ?
            AND avail.day_of_week = ?
            AND avail.is_active = 1
            AND avail.start_time <= ?
            AND avail.end_time > ?

            -- PARTE 2: Garantir que não existe agendamento conflitante
            AND NOT EXISTS (
                SELECT 1 FROM appointments app
                WHERE app.professional_id = avail.professional_id
                  AND app.date = ?
                  AND app.time = ?
                  AND app.status NOT IN ('cancelled_by_patient', 'cancelled_by_clinic', 'no_show')
            )
        LIMIT 1;
    `;

    try {
      const row = await database.queryOne<{ id: number }>(sql, [
        professionalId,
        dayOfWeek,
        time,
        time,
        date,
        time,
      ]);

      return row !== null;
    } catch (error) {
      console.error("Database Error [isProfessionalAvailable]:", error);
      throw new Error(
        "Falha técnica ao verificar disponibilidade do profissional.",
      );
    }
  }
}
