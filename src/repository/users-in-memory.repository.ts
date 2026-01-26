import type { ProfessionalDetails } from "@models/professional.model.js";
import type { CreateUserPayload, User, UserWithDetails } from "@models/user.js";
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
    return this.users.find((user) => user.id === id);
  }
  findByCpf(cpf: string): Promise<User | null> {
    return this.users.find((user) => user.cpf === cpf);
  }

  public async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findProfessionalDetailsByUserId(
    userId: number,
  ): Promise<ProfessionalDetails | null> {
    const user = this.users.find((u) => u.id === userId);
    return user?.professional_details || null;
  }

  async findByClinicId(clinicId: number): Promise<User[]> {
    return this.users.filter((user) => user.clinicId === clinicId);
  }

  async findWithDetailsById(userId: number): Promise<UserWithDetails | null> {
    const user = this.users.find((u) => u.id === userId);
    return user ? (user as UserWithDetails) : null;
  }

  async delete(id: number): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id);
  }

  // Método auxiliar para gerar IDs e datas, mantendo o padrão do banco
  private generateId(): number {
    return this.users.length + 1;
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
    let filteredUsers = this.users.filter((user) => user.clinicId === clinicId);

    if (filters.role) {
      filteredUsers = filteredUsers.filter((user) => user.role === filters.role);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower),
      );
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = filteredUsers.slice(startIndex, startIndex + pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}
