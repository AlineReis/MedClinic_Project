import type { ProfessionalDetails } from "@models/professional.model.js";
import type { CreateUserPayload, User, UserWithDetails } from "@models/user.js";
import type { IUserRepository } from "./iuser.repository.js";

export class InMemoryUserRepository implements IUserRepository {
  private users: UserWithDetails[] = [];

  public async create(payload: CreateUserPayload): Promise<number> {
    const id = this.generateId();

    const now = new Date().toISOString();

    const record: UserWithDetails = {
      id,
      name: payload.name,
      email: payload.email,
      password: payload.password ?? "",
      role: payload.role,
      cpf: payload.cpf ?? null,
      phone: payload.phone ?? undefined,

      // importante para as rotas por clínica e para manter padrão com DB
      clinic_id: (payload as any).clinic_id ?? 1,

      created_at: now,
      updated_at: now,

      // pode existir/ser usado nos testes
      professional_details: null,
    };

    this.users.push(record);

    return id;
  }

  public async createPatient(userData: User): Promise<number> {
    // Para testes: cria como patient (mantém o mínimo necessário)
    return this.create({
      name: userData.name,
      email: userData.email,
      password: userData.password ?? "",
      role: "patient" as any,
      cpf: userData.cpf ?? null,
      phone: userData.phone ?? undefined,
      clinic_id: (userData as any).clinic_id ?? 1,
    } as any);
  }

  public async createHealthProfessional(
    userData: CreateUserPayload,
  ): Promise<number> {
    // Para testes: cria como health_professional
    return this.create({
      ...userData,
      role: "health_professional" as any,
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  public async findById(id: number): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  public async findByCpf(cpf: string): Promise<User | null> {
    return this.users.find((user) => user.cpf === cpf) ?? null;
  }

  public async findProfessionalDetailsByUserId(
    userId: number,
  ): Promise<ProfessionalDetails | null> {
    const user = this.users.find((u) => u.id === userId);
    return user?.professional_details ?? null;
  }

  public async findByClinicId(clinicId: number): Promise<User[]> {
    return this.users.filter((user) => user.clinic_id === clinicId);
  }

  public async findWithDetailsById(
    userId: number,
  ): Promise<UserWithDetails | null> {
    const user = this.users.find((u) => u.id === userId);
    return user ?? null;
  }

  public async listByClinicIdPaginated(
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

    let items = this.users.filter((u) => u.clinic_id === clinicId);

    if (filters.role) {
      items = items.filter((u) => u.role === filters.role);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter((u) => (u.name ?? "").toLowerCase().includes(q));
    }

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const start = (page - 1) * pageSize;
    const paginated = items.slice(start, start + pageSize);

    return {
      items: paginated,
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
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return;

    this.users[idx] = {
      ...this.users[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    } as UserWithDetails;
  }

  public async delete(id: number): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id);
  }

  // Método auxiliar para gerar IDs
  private generateId(): number {
    return this.users.length + 1;
  }
}
