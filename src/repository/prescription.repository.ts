import { database } from "../config/database.js";
import { Prescription } from "../models/prescription.js";

export class PrescriptionRepository {
  async create(data: Omit<Prescription, "id" | "created_at">): Promise<number> {
    const sql = `
            INSERT INTO prescriptions (
                appointment_id, patient_id, professional_id, medication_name,
                dosage, instructions, is_controlled, pdf_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

    const result = await database.run(sql, [
      data.appointment_id,
      data.patient_id,
      data.professional_id,
      data.medication_name,
      data.dosage || null,
      data.instructions || null,
      data.is_controlled ? 1 : 0,
      data.pdf_url || null,
    ]);

    return result.lastID;
  }

  async findById(id: number): Promise<Prescription | null> {
    const sql = `SELECT * FROM prescriptions WHERE id = ?`;
    const result = await database.queryOne<any>(sql, [id]);

    if (result) {
      return {
        ...result,
        is_controlled: !!result.is_controlled,
      } as Prescription;
    }
    return null;
  }

  async findByAppointmentId(appointmentId: number): Promise<Prescription[]> {
    const sql = `SELECT * FROM prescriptions WHERE appointment_id = ? ORDER BY created_at DESC`;
    const results = await database.query<any>(sql, [appointmentId]);

    return results.map((r) => ({
      ...r,
      is_controlled: !!r.is_controlled,
    })) as Prescription[];
  }

  async findByPatientId(patientId: number): Promise<Prescription[]> {
    const sql = `SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC`;
    const results = await database.query<any>(sql, [patientId]);

    return results.map((r) => ({
      ...r,
      is_controlled: !!r.is_controlled,
    })) as Prescription[];
  }

  async findByProfessionalId(professionalId: number): Promise<Prescription[]> {
    const sql = `SELECT * FROM prescriptions WHERE professional_id = ? ORDER BY created_at DESC`;
    const results = await database.query<any>(sql, [professionalId]);

    return results.map((r) => ({
      ...r,
      is_controlled: !!r.is_controlled,
    })) as Prescription[];
  }
}
