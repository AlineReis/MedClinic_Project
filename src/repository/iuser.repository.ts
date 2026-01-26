import type { CreateUserPayload, User } from "../models/user.js";

export interface IUserRepository {
  createPatient(userData: User): Promise<number>;
  createHealthProfessional(userData: CreateUserPayload): Promise<number>;
  create(userData: CreateUserPayload): Promise<number>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findByCpf(cpf: string): Promise<User | null>;
}
