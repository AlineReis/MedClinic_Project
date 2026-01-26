import { database } from '../config/database.js';
import { ProfessionalDetails } from '../models/professional.model.js';

export class ProfessionalRepository {
  
  async create(details: ProfessionalDetails): Promise<number> {
    const sql = `
      INSERT INTO professional_details (
        user_id, specialty, registration_number, council, 
        consultation_price, commission_percentage
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await database.run(sql, [
      details.user_id,
      details.specialty,
      details.registration_number,
      details.council || null,
      details.consultation_price,
      details.commission_percentage || 60.00
    ]);

    return result.lastID;
  }

  async findByUserId(userId: number): Promise<ProfessionalDetails | null> {
    const sql = `SELECT * FROM professional_details WHERE user_id = ?`;
    return await database.queryOne<ProfessionalDetails>(sql, [userId]);
  }
  async findBySpecialty(specialty: string): Promise<{id: number, name: string, specialty: string, consultation_price: number}[]> {
    const sql = `
      SELECT u.id, u.name, pd.specialty, pd.consultation_price 
      FROM professional_details pd
      JOIN users u ON u.id = pd.user_id
      WHERE pd.specialty = ?
    `;
    return await database.query<any>(sql, [specialty]);
  }
}
