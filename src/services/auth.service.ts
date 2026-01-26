import type { AuthResult, CreateUserPayload } from "@models/user.js";
import type { UserRepository } from "@repositories/user.repository.js";

import { ValidationError } from "utils/errors.js";
import { SecurityUtils } from "utils/security.js";
import {
  getPasswordMissingRequirements,
  isValidCpfFormat,
  isValidEmail,
  isValidPhone,
  isValidRole,
  sanitizeCpf,
} from "utils/validators.js";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  public async registerPatient(input: CreateUserPayload): Promise<AuthResult> {
    this.validateRegistrationInput(input);

    const emailNormalized = input.email.toLowerCase();
    const cleanCpf = sanitizeCpf(input.cpf);

    const [existingEmail, existingCpf] = await Promise.all([
      this.userRepository.findByEmail(emailNormalized),
      this.userRepository.findByCpf(cleanCpf),
    ]);

    if (existingEmail) {
      throw new ValidationError("Este email já está em uso", "email");
    }
    if (existingCpf) {
      throw new ValidationError("Este CPF já está cadastrado", "cpf");
    }

    const hashedPassword = await SecurityUtils.hashPassword(input.password);

    const userId = await this.userRepository.create({
      ...input,
      cpf: cleanCpf,
      email: emailNormalized,
      password: hashedPassword,
      role: "patient",
    });

    return {
      id: userId,
      name: input.name,
      email: emailNormalized,
      role: "patient",
    };
  }

  private validateRegistrationInput(input: CreateUserPayload): void {
    const { cpf, email, name, password, role, phone } = input;

    if (!name || name.trim().length < 2) {
      throw new ValidationError("Nome deve ter ao menos 2 letras", "name");
    }
    if (!isValidCpfFormat(cpf)) {
      throw new ValidationError("Formato do CPF é inválido", "cpf");
    }
    if (!isValidEmail(email)) {
      throw new ValidationError("Email no formato inválido", "email");
    }
    const passwordErrors = getPasswordMissingRequirements(password);
    if (passwordErrors.length > 0) {
      const message = `A senha deve conter: ${passwordErrors.join(", ")}.`;
      throw new ValidationError(message, "password");
    }
    if (phone && !isValidPhone(phone)) {
      throw new ValidationError("Formato de telefone inválido", "phone");
    }
    if (!isValidRole(role) || role !== "patient") {
      throw new ValidationError(
        "Esse método é exclusivo para registro de pacientes",
        "role",
      );
    }
  }
}
