import type { ProfessionalDetails } from "@models/professional.model.js";
import type {
  CreateUserPayload,
  User,
  UserWithDetails,
  UserRole,
} from "../models/user.js";

export interface IUserRepository {
  createPatient(userData: User): Promise<number>;
  createHealthProfessional(userData: CreateUserPayload): Promise<number>;
  create(userData: CreateUserPayload): Promise<number>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findByCpf(cpf: string): Promise<User | null>;
  findProfessionalDetailsByUserId(
    userId: number,
  ): Promise<ProfessionalDetails | null>;
  findByClinicId(clinicId: number): Promise<User[]>;
  listByClinicIdPaginated(
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
  }>;
  findWithDetailsById(userId: number): Promise<UserWithDetails | null>;
  delete(id: number, requestingUserRole: UserRole): Promise<void>;
  updateById(
    userId: number,
    patch: Partial<{
      name: string;
      email: string;
      phone: string;
      password: string;
    }>,
  ): Promise<void>;

}
