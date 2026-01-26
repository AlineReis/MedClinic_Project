import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repository/user.repository.js';
import { User } from '../models/user.js';
import * as Validators from '../utils/validators.js';
import { AuthError, ValidationError } from "../utils/errors.js";

// Representa o usuário que fez a requisição (extraído do token JWT) - From backend-main
type RequesterUser = {
  id: number;
  role: "clinic_admin" | "receptionist" | "system_admin" | string;
  clinic_id?: number | null;
};

type ListUsersByClinicInput = {
  clinicId: number;
  requester?: RequesterUser;
};

export class UserService {
  private userRepo: UserRepository;

  constructor(userRepo?: UserRepository) {
    this.userRepo = userRepo || new UserRepository();
  }

  // --- Auth & Registration Logic (My Branch) ---

  async registerPatient(userData: User): Promise<{ user: User; token: string }> {
    if (!Validators.isValidEmail(userData.email)) throw new ValidationError('Invalid email format');
    if (userData.password && !Validators.isValidPassword(userData.password)) {
      throw new ValidationError('Password must have 8+ chars, uppercase, lowercase and number');
    }
    if (userData.cpf && !Validators.isValidCpfLogic(userData.cpf)) throw new ValidationError('Invalid CPF');

    const existingUser = await this.userRepo.findByEmail(userData.email);
    if (existingUser) throw new ValidationError('Email already in use');

    if (!userData.password) throw new ValidationError('Password is required');
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUserId = await this.userRepo.createPatient({
      ...userData,
      password: hashedPassword
    });

    const user = await this.userRepo.findById(newUserId);
    if (!user) throw new Error('Error retrieving created user');

    const { password, ...userWithoutPassword } = user;
    const token = this.generateToken(user);

    return { user: userWithoutPassword as User, token };
  }

  async login(email: string, passwordRaw: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new AuthError('Invalid email or password');
    if (!user.password) throw new AuthError('Invalid email or password');

    const isMatch = await bcrypt.compare(passwordRaw, user.password);
    if (!isMatch) throw new AuthError('Invalid email or password');

    const token = this.generateToken(user);
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword as User, token };
  }

  private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || 'default_secret_dev_only';
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '24h' }
    );
  }

  // --- Clinic Logic (Incoming from backend-main) ---

  public listUsersByClinic = async ({
    clinicId,
    requester,
  }: ListUsersByClinicInput) => {
    if (!Number.isFinite(clinicId) || clinicId <= 0) {
      throw new ValidationError("clinic_id inválido");
    }

    if (!requester) {
      throw new AuthError("User not authenticated");
    }

    const allowedRoles = ["clinic_admin", "receptionist", "system_admin"] as const;
    const isRoleAllowed = allowedRoles.includes(requester.role as any);

    if (!isRoleAllowed) {
      throw new AuthError("Forbidden");
    }

    //system_admin pode acessar qualquer clínica
    if (requester.role !== "system_admin") {
      if (!requester.clinic_id) {
        throw new AuthError("Forbidden");
      }
      if (Number(requester.clinic_id) !== clinicId) {
        throw new AuthError("Forbidden");
      }
    }

    const users = await this.userRepo.findByClinicId(clinicId);

    return users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      clinic_id: u.clinic_id,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
  };
}
