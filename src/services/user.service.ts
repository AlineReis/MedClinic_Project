import { env } from "@config/config.js";
import type { IUserRepository } from "@repositories/iuser.repository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  User,
  type UserRole,
  type UserWithoutPassword,
} from "../models/user.js";
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import * as Validators from "../utils/validators.js";

// Representa o usuário que fez a requisição (extraído do token JWT) - From backend-main
type RequesterUser = {
  id: number;
  role: "clinic_admin" | "receptionist" | "system_admin" | string;
  clinic_id?: number | null;
};

type ListUsersByClinicInput = {
  clinicId: number;
  requester?: RequesterUser;
  filters?: {
    role?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  };
};

export type GetUserInput = {
  requesterId: number;
  requesterRole: UserRole;
  targetUserId: number;
};

import { AppointmentRepository } from "../repository/appointment.repository.js";

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly appointmentRepository: AppointmentRepository
  ) { }

  async registerPatient(
    userData: User,
  ): Promise<{ user: User; token: string }> {
    if (!Validators.isValidEmail(userData.email))
      throw new ValidationError("Invalid email format");
    if (userData.password && !Validators.isValidPassword(userData.password)) {
      throw new ValidationError(
        "Password must have 8+ chars, uppercase, lowercase and number",
      );
    }
    if (userData.cpf && !Validators.isValidCpfLogic(userData.cpf))
      throw new ValidationError("Invalid CPF");

    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) throw new ValidationError("Email already in use");

    if (!userData.password) throw new ValidationError("Password is required");
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUserId = await this.userRepository.createPatient({
      ...userData,
      password: hashedPassword,
    });

    const user = await this.userRepository.findById(newUserId);
    if (!user) throw new Error("Error retrieving created user");

    const { password, ...userWithoutPassword } = user;
    const token = this.generateToken(user);

    return { user: userWithoutPassword as User, token };
  }

  async login(
    email: string,
    passwordRaw: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new AuthError("Invalid email or password");
    if (!user.password) throw new AuthError("Invalid email or password");

    const isMatch = await bcrypt.compare(passwordRaw, user.password);
    if (!isMatch) throw new AuthError("Invalid email or password");

    const token = this.generateToken(user);
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword as User, token };
  }

  private generateToken(user: User): string {
    const secret = env.JWT_SECRET || "default_secret";
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "24h" },
    );
  }

  public async getUserById(input: GetUserInput): Promise<UserWithoutPassword> {
    const { requesterId, requesterRole, targetUserId } = input;

    if (requesterRole === "patient" && requesterId !== targetUserId) {
      throw new ForbiddenError(
        "Você não tem permissão para acessar este usuário",
      );
    }

    const user = await this.userRepository.findWithDetailsById(targetUserId);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  public async getUserByIdScoped(input: {
    clinicId: number;
    requester: RequesterUser;
    targetUserId: number;
  }) {
    const { clinicId, requester, targetUserId } = input;

    // permissões: próprio usuário OU admin
    const isSelf = requester.id === targetUserId;
    const isAdmin =
      requester.role === "clinic_admin" || requester.role === "system_admin";

    if (!isSelf && !isAdmin) {
      throw new ForbiddenError("Forbidden");
    }

    // se não for system_admin, só pode acessar a própria clínica
    if (requester.role !== "system_admin") {
      if (!requester.clinic_id || requester.clinic_id !== clinicId) {
        throw new ForbiddenError("Forbidden");
      }
    }

    const user = await this.userRepository.findWithDetailsById(targetUserId);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    // garantir que o usuário retornado pertence à clínica (exceto system_admin pode ver qualquer uma)
    if (requester.role !== "system_admin") {
      if (Number((user as any).clinic_id) !== clinicId) {
        throw new ForbiddenError("Forbidden");
      }
    }

    const { password, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  // --- Clinic Logic (Incoming from backend-main) ---
  public listUsersByClinic = async ({
    clinicId,
    requester,
    filters,
  }: ListUsersByClinicInput) => {
    if (!requester) {
      throw new AuthError("User not authenticated");
    }

    const allowedRoles = [
      "clinic_admin",
      "receptionist",
      "system_admin",
    ] as const;
    const isRoleAllowed = allowedRoles.includes(requester.role as any);

    if (!isRoleAllowed) {
      throw new AuthError("Forbidden");
    }

    // system_admin pode acessar qualquer clínica
    if (requester.role !== "system_admin") {
      if (!requester.clinic_id) {
        throw new AuthError("Forbidden");
      }
      if (Number(requester.clinic_id) !== clinicId) {
        throw new AuthError("Forbidden");
      }
    }

    const result = await this.userRepository.listByClinicIdPaginated(
      clinicId,
      filters ?? {},
    );

    return {
      ...result,
      items: result.items.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        clinic_id: u.clinic_id,
        created_at: u.created_at,
        updated_at: u.updated_at,
      })),
    };
  };

  public async updateUserScoped(input: {
    clinicId: number;
    requester: RequesterUser;
    targetUserId: number;
    data: any;
  }) {
    const { clinicId, requester, targetUserId, data } = input;

    const isSelf = requester.id === targetUserId;
    const isAdmin =
      requester.role === "clinic_admin" || requester.role === "system_admin";

    if (!isSelf && !isAdmin) {
      throw new ForbiddenError("Forbidden");
    }

    // clinic scope (system_admin pode acessar qualquer clínica)
    if (requester.role !== "system_admin") {
      if (!requester.clinic_id || Number(requester.clinic_id) !== clinicId) {
        throw new ForbiddenError("Forbidden");
      }
    }

    const existing = await this.userRepository.findById(targetUserId);
    if (!existing) throw new NotFoundError("Usuário não encontrado");

    if (requester.role !== "system_admin") {
      if (Number((existing as any).clinic_id) !== clinicId) {
        throw new ForbiddenError("Forbidden");
      }
    }

    // Regras da task:
    // - self: pode name/email/phone/password
    // - admin: pode atualizar campos, MAS NÃO role e NÃO password
    const patch: Record<string, any> = {};

    if (typeof data?.name === "string") patch.name = data.name.trim();

    if (typeof data?.email === "string") {
      const email = data.email.trim();
      if (!Validators.isValidEmail(email)) {
        throw new ValidationError("Invalid email format");
      }
      patch.email = email;
    }

    if (typeof data?.phone === "string") patch.phone = data.phone.trim();

    // Bloqueia role sempre (pela descrição que você comentou antes)
    if (data?.role !== undefined) {
      throw new ForbiddenError("Não é permitido alterar role");
    }

    // password: somente o próprio usuário
    if (data?.password !== undefined) {
      if (!isSelf) {
        throw new ForbiddenError("Não é permitido alterar password");
      }
      if (typeof data.password !== "string" || !data.password) {
        throw new ValidationError("Password is required");
      }
      if (!Validators.isValidPassword(data.password)) {
        throw new ValidationError(
          "Password must have 8+ chars, uppercase, lowercase and number",
        );
      }
      patch.password = await bcrypt.hash(data.password, 10);
    }

    // Se for admin, ok atualizar name/email/phone (e outros que existirem no patch)
    // Se não for admin (self), patch já está limitado
    if (!isAdmin && !isSelf) throw new ForbiddenError("Forbidden");

    if (Object.keys(patch).length === 0) {
      throw new ValidationError("Nenhum campo válido para atualizar");
    }

    await this.userRepository.updateById(targetUserId, patch);

    const updated = await this.userRepository.findWithDetailsById(targetUserId);
    if (!updated) throw new Error("Erro ao recuperar usuário atualizado");

    const { password, ...withoutPassword } = updated as any;
    return withoutPassword;
  }

  async deleteUser(requester: RequesterUser, targetUserId: number): Promise<void> {
    if (requester.role !== 'clinic_admin' && requester.role !== 'system_admin') {
      throw new ForbiddenError("Apenas administradores podem deletar usuários.");
    }
    const hasPending = await this.appointmentRepository.checkActiveAppointments(targetUserId);
    if (hasPending) {
      throw new ValidationError("Não é possível deletar o usuário pois ele possui agendamentos ativos.");
    }
    await this.userRepository.delete(targetUserId);
  }
}
