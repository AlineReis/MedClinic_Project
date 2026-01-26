import type { ProfessionalDetails } from "@models/professional.model.js";
import { database } from "../config/database.js";
import {
  User,
  type CreateUserPayload,
  type UserWithDetails,
} from "../models/user.js";
import { sanitizeCpf } from "../utils/validators.js";

export class UserRepository {
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

  //busca os usuários de uma clínica específica (from backend-main)
  async findByClinicId(clinicId: number): Promise<User[]> {
    const sql = `SELECT * FROM users WHERE clinic_id = ? ORDER BY id ASC`;
    return await database.query<User>(sql, [clinicId]);
  }
}
