import { database } from "../config/database.js";
import {
  Transaction,
  TransactionFilters,
  TransactionStatus,
} from "../models/transaction.js";

export class TransactionRepository {
  // Criar nova transação
  async create(transaction: Transaction): Promise<number> {
    const sql = `
            INSERT INTO transactions (
                type, reference_id, reference_type, payer_id,
                amount_gross, mdr_fee, amount_net, installments,
                payment_method, gateway_transaction_id, card_brand, card_last4,
                status, processed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    const result = await database.run(sql, [
      transaction.type,
      transaction.reference_id,
      transaction.reference_type,
      transaction.payer_id,
      transaction.amount_gross,
      transaction.mdr_fee,
      transaction.amount_net,
      transaction.installments || 1,
      transaction.payment_method || "credit_card",
      transaction.gateway_transaction_id || null,
      transaction.card_brand || null,
      transaction.card_last4 || null,
      transaction.status || "processing",
      transaction.processed_at || null,
    ]);

    return result.lastID;
  }

  // Buscar transação por ID
  async findById(id: number): Promise<Transaction | null> {
    const sql = `SELECT * FROM transactions WHERE id = ?`;
    return await database.queryOne<Transaction>(sql, [id]);
  }

  // Buscar por ID de referência (ex: appointment_id)
  async findByReferenceId(
    referenceId: number,
    referenceType: "appointment" | "exam",
  ): Promise<Transaction[]> {
    const sql = `
            SELECT * FROM transactions 
            WHERE reference_id = ? AND reference_type = ?
            ORDER BY created_at DESC
        `;
    return await database.query<Transaction>(sql, [referenceId, referenceType]);
  }

  // Atualizar status
  async updateStatus(
    id: number,
    status: TransactionStatus,
    gatewayId?: string,
  ): Promise<void> {
    let sql = `UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP`;
    const params: any[] = [status];

    if (gatewayId) {
      sql += `, gateway_transaction_id = ?`;
      params.push(gatewayId);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await database.run(sql, params);
  }
}
