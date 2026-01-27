import { database } from "../config/database.js";
import {
  CommissionSplit,
  CommissionStatus,
  CommissionSplitFilters,
} from "../models/commission-split.js";

export class CommissionSplitRepository {
  // Criar split de comissão
  async create(commission: CommissionSplit): Promise<number> {
    const sql = `
            INSERT INTO commission_splits (
                transaction_id, recipient_id, recipient_type,
                percentage, amount, status, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

    const result = await database.run(sql, [
      commission.transaction_id,
      commission.recipient_id !== undefined ? commission.recipient_id : null,
      commission.recipient_type,
      commission.percentage,
      commission.amount,
      commission.status || "pending",
      commission.paid_at || null,
    ]);

    return result.lastID;
  }

  // Buscar splits de uma transação
  async findByTransactionId(transactionId: number): Promise<CommissionSplit[]> {
    const sql = `SELECT * FROM commission_splits WHERE transaction_id = ?`;
    return await database.query<CommissionSplit>(sql, [transactionId]);
  }

  // Buscar comissões de um profissional (recebidas)
  async findByProfessionalId(
    professionalId: number,
  ): Promise<CommissionSplit[]> {
    const sql = `
            SELECT * FROM commission_splits 
            WHERE recipient_id = ? AND recipient_type = 'professional'
            ORDER BY created_at DESC
        `;
    return await database.query<CommissionSplit>(sql, [professionalId]);
  }

  // Atualizar status
  async updateStatus(
    id: number,
    status: CommissionStatus,
    paidAt?: string,
  ): Promise<void> {
    let sql = `UPDATE commission_splits SET status = ?`;
    const params: any[] = [status];

    if (paidAt) {
      sql += `, paid_at = ?`;
      params.push(paidAt);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await database.run(sql, params);
  }
}
