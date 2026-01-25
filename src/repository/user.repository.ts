import { database } from '../config/database.js';
import { User } from '../models/user.js';

export class UserRepository {
  
  async createPatient(userData: User): Promise<number> {
    const sql = `
      INSERT INTO users (name, email, password, role, cpf, phone, created_at)
      VALUES (?, ?, ?, 'patient', ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const password = userData.password || '';

    const result = await database.run(sql, [
      userData.name,
      userData.email,
      password,
      userData.cpf,
      userData.phone
    ]);

    return result.lastID;
  }

  async createHealthProfessional(userData: User): Promise<number> {
    const sql = `
      INSERT INTO users (name, email, password, role, cpf, phone, created_at)
      VALUES (?, ?, ?, 'health_professional', ?, ?, CURRENT_TIMESTAMP)
    `;

    const password = userData.password || '';

    const result = await database.run(sql, [
      userData.name,
      userData.email,
      password,
      userData.cpf,
      userData.phone
    ]);

    return result.lastID;
  }

  async create(userData: User): Promise<number> {
    const sql = `
      INSERT INTO users (name, email, password, role, cpf, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const password = userData.password || '';

    const result = await database.run(sql, [
      userData.name,
      userData.email,
      password,
      userData.role,
      userData.cpf,
      userData.phone
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
}