import { database } from "../config/database.js";
import type {
  MonthlyReport,
  MonthlyReportFilters,
  PaymentStatus,
} from "../models/monthly-report.js";

export class MonthlyReportRepository {
  /**
   * Generate a monthly commission report for a professional
   * Aggregates commission data from commission_splits and transactions
   */
  async generateReport(
    professionalId: number,
    month: number,
    year: number,
  ): Promise<number> {
    // First, calculate the aggregated values
    const aggregateQuery = `
      SELECT
        COUNT(DISTINCT a.id) as total_appointments,
        COALESCE(SUM(t.amount_gross), 0) as total_gross_amount,
        COALESCE(SUM(t.amount_net), 0) as total_net_amount,
        COALESCE(SUM(cs.amount), 0) as total_commission,
        COALESCE(SUM(t.mdr_fee), 0) as total_deductions
      FROM commission_splits cs
      JOIN transactions t ON cs.transaction_id = t.id
      JOIN appointments a ON t.reference_id = a.id AND t.reference_type = 'appointment'
      WHERE cs.recipient_id = ?
        AND cs.recipient_type = 'professional'
        AND strftime('%Y', t.created_at) = ?
        AND strftime('%m', t.created_at) = ?
        AND t.status = 'paid'
        AND a.status = 'completed'
    `;

    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, "0");

    const aggregateResult = await database.queryOne<{
      total_appointments: number;
      total_gross_amount: number;
      total_net_amount: number;
      total_commission: number;
      total_deductions: number;
    }>(aggregateQuery, [professionalId, yearStr, monthStr]);

    if (!aggregateResult) {
      throw new Error("Failed to calculate report aggregates");
    }

    const amountToReceive = aggregateResult.total_commission;

    // Insert the report
    const insertSql = `
      INSERT INTO monthly_reports (
        professional_id, month, year,
        total_appointments, total_gross_amount, total_net_amount,
        total_commission, total_deductions, amount_to_receive,
        payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated')
    `;

    const result = await database.run(insertSql, [
      professionalId,
      month,
      year,
      aggregateResult.total_appointments,
      aggregateResult.total_gross_amount,
      aggregateResult.total_net_amount,
      aggregateResult.total_commission,
      aggregateResult.total_deductions,
      amountToReceive,
    ]);

    return result.lastID;
  }

  /**
   * Find reports for a specific professional with optional filters
   */
  async findByProfessional(
    professionalId: number,
    filters?: MonthlyReportFilters,
  ): Promise<MonthlyReport[]> {
    let sql = `
      SELECT * FROM monthly_reports
      WHERE professional_id = ?
    `;
    const params: any[] = [professionalId];

    if (filters?.month) {
      sql += ` AND month = ?`;
      params.push(filters.month);
    }

    if (filters?.year) {
      sql += ` AND year = ?`;
      params.push(filters.year);
    }

    if (filters?.payment_status) {
      sql += ` AND payment_status = ?`;
      params.push(filters.payment_status);
    }

    sql += ` ORDER BY year DESC, month DESC`;

    return await database.query<MonthlyReport>(sql, params);
  }

  /**
   * Find a specific report by ID
   */
  async findById(reportId: number): Promise<MonthlyReport | null> {
    const sql = `SELECT * FROM monthly_reports WHERE id = ?`;
    return await database.queryOne<MonthlyReport>(sql, [reportId]);
  }

  /**
   * Mark a report as paid
   */
  async markAsPaid(reportId: number, paymentDate: string): Promise<void> {
    const sql = `
      UPDATE monthly_reports
      SET payment_status = 'paid', payment_date = ?
      WHERE id = ?
    `;
    await database.run(sql, [paymentDate, reportId]);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    reportId: number,
    status: PaymentStatus,
  ): Promise<void> {
    const sql = `
      UPDATE monthly_reports
      SET payment_status = ?
      WHERE id = ?
    `;
    await database.run(sql, [status, reportId]);
  }

  /**
   * Find all pending reports (for admin view)
   */
  async findPendingReports(clinicId?: number): Promise<MonthlyReport[]> {
    let sql = `
      SELECT mr.*
      FROM monthly_reports mr
      JOIN users u ON mr.professional_id = u.id
      WHERE mr.payment_status IN ('generated', 'pending', 'processing')
    `;
    const params: any[] = [];

    if (clinicId) {
      sql += ` AND u.clinic_id = ?`;
      params.push(clinicId);
    }

    sql += ` ORDER BY mr.year DESC, mr.month DESC`;

    return await database.query<MonthlyReport>(sql, params);
  }

  /**
   * Find all reports for a clinic (admin view)
   */
  async findByClinic(
    clinicId: number,
    filters?: MonthlyReportFilters,
  ): Promise<MonthlyReport[]> {
    let sql = `
      SELECT mr.*
      FROM monthly_reports mr
      JOIN users u ON mr.professional_id = u.id
      WHERE u.clinic_id = ?
    `;
    const params: any[] = [clinicId];

    if (filters?.month) {
      sql += ` AND mr.month = ?`;
      params.push(filters.month);
    }

    if (filters?.year) {
      sql += ` AND mr.year = ?`;
      params.push(filters.year);
    }

    if (filters?.payment_status) {
      sql += ` AND mr.payment_status = ?`;
      params.push(filters.payment_status);
    }

    sql += ` ORDER BY mr.year DESC, mr.month DESC`;

    return await database.query<MonthlyReport>(sql, params);
  }
}
