import { database } from "../config/database.js";
import { ExamCatalog, ExamRequest, ExamRequestStatus } from "../models/exam.js";

export class ExamRepository {

  async findAllCatalog(): Promise<ExamCatalog[]> {
    const sql = `SELECT * FROM exam_catalog WHERE is_active = 1 ORDER BY type, name`;
    return await database.query<ExamCatalog>(sql);
  }

  async findCatalogById(id: number): Promise<ExamCatalog | null> {
    const sql = `SELECT * FROM exam_catalog WHERE id = ?`;
    return await database.queryOne<ExamCatalog>(sql, [id]);
  }

  async findCatalogByType(type: string): Promise<ExamCatalog[]> {
    const sql = `SELECT * FROM exam_catalog WHERE type = ? AND is_active = 1 ORDER BY name`;
    return await database.query<ExamCatalog>(sql, [type]);
  }

  async createRequest(
    request: Omit<ExamRequest, "id" | "created_at" | "updated_at">,
  ): Promise<number> {
    const sql = `
            INSERT INTO exam_requests (
                appointment_id, patient_id, requesting_professional_id, exam_catalog_id,
                clinical_indication, price, status, payment_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

    const result = await database.run(sql, [
      request.appointment_id,
      request.patient_id,
      request.requesting_professional_id,
      request.exam_catalog_id,
      request.clinical_indication,
      request.price,
      request.status || "pending_payment",
      request.payment_status || "pending",
    ]);

    return result.lastID;
  }

  async findRequestById(id: number): Promise<ExamRequest | null> {
    const sql = `SELECT * FROM exam_requests WHERE id = ?`;
    return await database.queryOne<ExamRequest>(sql, [id]);
  }

  async findRequestsByAppointmentId(
    appointmentId: number,
  ): Promise<ExamRequest[]> {
    const sql = `SELECT * FROM exam_requests WHERE appointment_id = ?`;
    return await database.query<ExamRequest>(sql, [appointmentId]);
  }

  async findRequestsByPatientId(patientId: number): Promise<ExamRequest[]> {
    const sql = `
            SELECT er.*, ec.name as exam_name 
            FROM exam_requests er
            JOIN exam_catalog ec ON er.exam_catalog_id = ec.id
            WHERE er.patient_id = ?
            ORDER BY er.created_at DESC
        `;
    return await database.query<ExamRequest>(sql, [patientId]);
  }

  async findRequestsByProfessionalId(
    professionalId: number,
  ): Promise<ExamRequest[]> {
    const sql = `
             SELECT er.*, ec.name as exam_name 
            FROM exam_requests er
            JOIN exam_catalog ec ON er.exam_catalog_id = ec.id
            WHERE er.requesting_professional_id = ?
            ORDER BY er.created_at DESC
        `;
    return await database.query<ExamRequest>(sql, [professionalId]);
  }

  async findAllRequests(): Promise<ExamRequest[]> {
    const sql = `
             SELECT er.*, ec.name as exam_name 
            FROM exam_requests er
            JOIN exam_catalog ec ON er.exam_catalog_id = ec.id
            ORDER BY er.created_at DESC
        `;
    return await database.query<ExamRequest>(sql);
  }

  async updateStatus(id: number, status: ExamRequestStatus): Promise<void> {
    const sql = `UPDATE exam_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await database.run(sql, [status, id]);
  }

  // Método extra para Lab Tech lançar resultado
  async updateResult(
    id: number,
    resultUrl: string,
    resultText: string,
    labTechId: number,
  ): Promise<void> {
    const sql = `
            UPDATE exam_requests 
            SET result_file_url = ?, result_text = ?, lab_tech_id = ?, status = 'ready', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
    await database.run(sql, [resultUrl, resultText, labTechId, id]);
  }
}
