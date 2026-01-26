import type { CreateUserPayload, User } from "@models/user.js";
import type { IUserRepository } from "./iuser.repository.js";

export class InMemoryUserRepository implements IUserRepository {
  private users: any[] = [];

  public async create(payload: CreateUserPayload): Promise<number> {
    const id = this.generateId();

    const record: User = {
      id,
      name: payload.name,
      email: payload.email,
      password: payload.password ?? "",
      role: payload.role,
      cpf: payload.cpf ?? null,
      phone: payload.phone ?? undefined,
      created_at: new Date().toISOString(),
    };

    this.users.push(record);

    return id;
  }

  createPatient(userData: User): Promise<number> {
    throw new Error("Method not implemented.");
  }
  createHealthProfessional(userData: CreateUserPayload): Promise<number> {
    throw new Error("Method not implemented.");
  }
  findById(id: number): Promise<User | null> {
    return this.users.find(user => user.id === id);
  }
  findByCpf(cpf: string): Promise<User | null> {
    return this.users.find(user => user.cpf === cpf);
  }

  public async findByEmail(email: string) {
    return this.users.find(user => user.email === email) ?? null;
  }

  // Método auxiliar para gerar IDs e datas, mantendo o padrão do banco
  private generateId(): number {
    return this.users.length + 1;
  }
}
