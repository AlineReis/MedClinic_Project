import { database } from "../config/database.js";

export type CommissionRecord = {
  id: number;
  appointment_id: number;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};

export type CommissionSummary = {
  pending: number;
  paid: number;
  total: number;
};

export class CommissionRepository {
  public async listByProfessional(
    professionalId: number,
    month?: number,
    year?: number,
    status?: string,
  ): Promise<CommissionRecord[]> {
    const filters: string[] = [
      "cs.recipient_id = ?",
      "cs.recipient_type = 'professional'",
    ];
    const params: Array<string | number> = [professionalId];

    if (status) {
      filters.push("cs.status = ?");
      params.push(status);
    }
    if (month) {
      filters.push("CAST(strftime('%m', t.created_at) AS INTEGER) = ?");
      params.push(month);
    }
    if (year) {
      filters.push("CAST(strftime('%Y', t.created_at) AS INTEGER) = ?");
      params.push(year);
    }

    const query = `
      SELECT
        cs.id,
        t.reference_id AS appointment_id,
        cs.amount,
        cs.status,
        cs.created_at,
        CASE WHEN cs.status = 'paid' THEN cs.created_at ELSE NULL END AS paid_at
      FROM commission_splits cs
      INNER JOIN transactions t ON t.id = cs.transaction_id
      WHERE ${filters.join(" AND ")}
      ORDER BY cs.created_at DESC
    `;

    return database.query<CommissionRecord>(query, params);
  }
}
