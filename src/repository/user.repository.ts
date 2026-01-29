import type { ProfessionalDetails } from "@models/professional.model.js";
import type { IUserRepository } from "@repositories/iuser.repository.js";
import { database } from "../config/database.js";
import {
  User,
  type CreateUserPayload,
  type UserWithDetails,
  type UserRole,
} from "../models/user.js";
import { sanitizeCpf } from "../utils/validators.js";

export class UserRepository implements IUserRepository {
  async createPatient(userData: User): Promise<number> {
    const sql = `
      INSERT INTO users (name, email, password, role, cpf, phone, created_at)
      VALUES (?, ?, ?, 'patient', ?, ?, CURRENT_TIMESTAMP)
    `;

    const password = userData.password || "";

    const result = await database.run(sql, [
      userData.name,
      userData.email,
      password,
      userData.cpf,
      userData.phone,
    ]);

    return result.lastID;
  }

  async createHealthProfessional(userData: CreateUserPayload): Promise<number> {
    const sql = `
      INSERT INTO users (name, email, password, role, cpf, phone, created_at)
      VALUES (?, ?, ?, 'health_professional', ?, ?, CURRENT_TIMESTAMP)
    `;

    const password = userData.password || "";

    const result = await database.run(sql, [
      userData.name,
      userData.email,
      password,
      userData.cpf,
      userData.phone,
    ]);

    return result.lastID;
  }

  async create(userData: CreateUserPayload): Promise<number> {
    const sql = `
      INSERT INTO users (name, email, password, role, cpf, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const password = userData.password || "";

    const result = await database.run(sql, [
      userData.name,
      userData.email,
      password,
      userData.role,
      userData.cpf,
      userData.phone,
    ]);

    return result.lastID;
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = `SELECT * FROM users WHERE email = ?`;
    return await database.queryOne<User>(sql, [email]);
  }

  async findById(id: number): Promise<User | null> {
    const sql = `SELECT * FROM users WHERE id = ?`;
    return await database.queryOne<User>(sql, [id]);
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const cleanCpf = sanitizeCpf(cpf);
    const sql = `SELECT * FROM users WHERE cpf = ?`;
    return await database.queryOne<User>(sql, [cleanCpf]);
  }

  public async findWithDetailsById(
    userId: number,
  ): Promise<UserWithDetails | null> {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    if (user.role !== "health_professional") {
      return user;
    }

    const details = await this.findProfessionalDetailsByUserId(userId);
    return { ...user, professional_details: details };
  }

  public async findProfessionalDetailsByUserId(
    userId: number,
  ): Promise<ProfessionalDetails | null> {
    const sql = `
      SELECT specialty, registration_number, council, consultation_price, commission_percentage
      FROM professional_details
      WHERE user_id = ?
    `;
    return database.queryOne<ProfessionalDetails>(sql, [userId]);
  }

  async delete(id: number): Promise<void> {
    const sql = `DELETE FROM users WHERE id = ?`;
    await database.run(sql, [id]);
  }

  //busca os usuarios de uma cl�nica espec�fica (from backend-main)
  async findByClinicId(clinicId: number): Promise<User[]> {
    const sql = `
      SELECT * FROM users
      WHERE clinic_id = ? AND deleted_at IS NULL
      ORDER BY id ASC
    `;
    return await database.query<User>(sql, [clinicId]);
  }

  async listByClinicIdPaginated(
    clinicId: number,
    filters: {
      role?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{
    items: User[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }> {
    const page =
      Number.isFinite(filters.page) && (filters.page as number) > 0
        ? (filters.page as number)
        : 1;

    const pageSizeRaw =
      Number.isFinite(filters.pageSize) && (filters.pageSize as number) > 0
        ? (filters.pageSize as number)
        : 10;

    const pageSize = Math.min(pageSizeRaw, 50);
    const offset = (page - 1) * pageSize;
    // TODO: Voltar aqui depois de implementar o clinic_id
    // const where: string[] = ["clinic_id = ?"];
    const where: string[] = [];
    // const params: unknown[] = [clinicId];
    const params: unknown[] = [];

    if (filters.role) {
      where.push("role = ?");
      params.push(filters.role);
    }

    if (filters.search && filters.search.trim()) {
      where.push("name LIKE ?");
      params.push(`%${filters.search.trim()}%`);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const countSql = `SELECT COUNT(*) as total FROM users ${whereSql}`;
    const countRow = await database.queryOne<{ total: number }>(
      countSql,
      params,
    );
    const total = Number(countRow?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const itemsSql = `
      SELECT * FROM users
      ${whereSql}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `;

    const items = await database.query<User>(itemsSql, [
      ...params,
      pageSize,
      offset,
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }
  public async updateById(
    userId: number,
    patch: Partial<{
      name: string;
      email: string;
      phone: string;
      password: string;
    }>,
  ): Promise<void> {
    const fields = Object.keys(patch) as Array<keyof typeof patch>;
    if (fields.length === 0) return;

    const setSql = fields.map((f) => `${String(f)} = ?`).join(", ");
    const values = fields.map((f) => (patch as any)[f]);

    const sql = `
    UPDATE users
    SET ${setSql}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

    await database.run(sql, [...values, userId]);
  }

  async deleteById(id: number): Promise<void> {
  const sql = `
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `;
  await database.run(sql, [id]);
}

}
