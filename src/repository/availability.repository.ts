import { database } from '../config/database.js';
import { Availability } from '../models/professional.model.js';

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
      avail.end_time
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
}
