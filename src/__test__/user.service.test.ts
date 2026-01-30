import { jest } from '@jest/globals';
import { UserService } from "../services/user.service.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import type { IUserRepository } from "../repositories/iuser.repository.js";
import { User, UserRole } from "../models/user.js";
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

// Mock manual das dependências
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(),
};

const mockValidators = {
  isValidEmail: jest.fn(),
  isValidPassword: jest.fn(),
  isValidCpfLogic: jest.fn(),
  isValidPhone: jest.fn(),
};

const mockEnv = {
  JWT_SECRET: "test_secret",
};

// Mock dos módulos usando jest.unstable_mockModule
jest.unstable_mockModule("bcrypt", () => ({
  default: mockBcrypt,
  hash: mockBcrypt.hash,
  compare: mockBcrypt.compare,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: mockJwt,
  sign: mockJwt.sign,
}));

jest.unstable_mockModule("../utils/validators.js", () => mockValidators);

jest.unstable_mockModule("../config/config.js", () => ({
  env: mockEnv,
}));

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;

  // Dados de teste reutilizáveis
  const mockUser: User = {
    id: 1,
    name: "João Silva",
    email: "joao@teste.com",
    password: "hashedPassword123",
    role: "patient" as UserRole,
    cpf: "12345678901",
    phone: "11999999999",
    clinic_id: 1,
  };

  const mockUserWithoutPassword = {
    id: 1,
    name: "João Silva",
    email: "joao@teste.com",
    role: "patient" as UserRole,
    cpf: "12345678901",
    phone: "11999999999",
    clinic_id: 1,
  };

  beforeEach(() => {
    // Reset de todos os mocks antes de cada teste
    jest.clearAllMocks();

    // Mock do repositório de usuários
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findWithDetailsById: jest.fn(),
      createPatient: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      listByClinicIdPaginated: jest.fn(),
    } as any;

    // Mock do repositório de agendamentos
    mockAppointmentRepository = {
      checkActiveAppointments: jest.fn(),
    } as any;

    // Configuração padrão do ambiente
    mockEnv.JWT_SECRET = "test_secret";

    // Instância do serviço
    userService = new UserService(mockUserRepository, mockAppointmentRepository);
  });

  describe("registerPatient", () => {
    const newUserData: User = {
      id: 0,
      name: "Novo Usuário",
      email: "novo@teste.com",
      password: "MinhaSenh@123",
      role: "patient",
      cpf: "12345678901",
      phone: "11999999999",
      clinic_id: 1,
    };

    it("deve registrar um novo paciente com sucesso", async () => {
      // Arrange (Preparar)
      mockValidators.isValidEmail.mockReturnValue(true);
      mockValidators.isValidPassword.mockReturnValue(true);
      mockValidators.isValidCpfLogic.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null); // Email não existe
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.createPatient.mockResolvedValue(2); // Novo ID
      mockUserRepository.findById.mockResolvedValue({
        ...newUserData,
        id: 2,
        password: "hashedPassword",
      });
      mockJwt.sign.mockReturnValue("fake_token" as never);

      // Act (Agir)
      const result = await userService.registerPatient(newUserData);

      // Assert (Verificar)
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe(newUserData.email);
      expect(result.user).not.toHaveProperty("password"); // Senha removida
      expect(mockUserRepository.createPatient).toHaveBeenCalledWith({
        ...newUserData,
        password: "hashedPassword",
      });
    });

    it("deve rejeitar email inválido", async () => {
      // Arrange
      mockValidators.isValidEmail.mockReturnValue(false);

      // Act & Assert
      await expect(userService.registerPatient(newUserData))
        .rejects
        .toThrow(new ValidationError("Invalid email format"));
    });

    it("deve rejeitar senha inválida", async () => {
      // Arrange
      mockValidators.isValidEmail.mockReturnValue(true);
      mockValidators.isValidPassword.mockReturnValue(false);

      // Act & Assert
      await expect(userService.registerPatient(newUserData))
        .rejects
        .toThrow(new ValidationError("Password must have 8+ chars, uppercase, lowercase and number"));
    });

    it("deve rejeitar CPF inválido", async () => {
      // Arrange
      mockValidators.isValidEmail.mockReturnValue(true);
      mockValidators.isValidPassword.mockReturnValue(true);
      mockValidators.isValidCpfLogic.mockReturnValue(false);

      // Act & Assert
      await expect(userService.registerPatient(newUserData))
        .rejects
        .toThrow(new ValidationError("Invalid CPF"));
    });

    it("deve rejeitar email já em uso", async () => {
      // Arrange
      mockValidators.isValidEmail.mockReturnValue(true);
      mockValidators.isValidPassword.mockReturnValue(true);
      mockValidators.isValidCpfLogic.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser); // Email já existe

      // Act & Assert
      await expect(userService.registerPatient(newUserData))
        .rejects
        .toThrow(new ValidationError("Email already in use"));
    });

    it("deve rejeitar se senha estiver ausente", async () => {
      // Arrange
      const userWithoutPassword = { ...newUserData, password: undefined };
      mockValidators.isValidEmail.mockReturnValue(true);
      mockValidators.isValidCpfLogic.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.registerPatient(userWithoutPassword as any))
        .rejects
        .toThrow(new ValidationError("Password is required"));
    });

    it("deve lançar erro se usuário criado não for encontrado", async () => {
      // Arrange
      mockValidators.isValidEmail.mockReturnValue(true);
      mockValidators.isValidPassword.mockReturnValue(true);
      mockValidators.isValidCpfLogic.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.createPatient.mockResolvedValue(2);
      mockUserRepository.findById.mockResolvedValue(null); // Usuário não encontrado

      // Act & Assert
      await expect(userService.registerPatient(newUserData))
        .rejects
        .toThrow("Error retrieving created user");
    });
  });

  describe("login", () => {
    const email = "joao@teste.com";
    const password = "MinhaSenh@123";

    it("deve fazer login com sucesso", async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue("fake_token" as never);

      // Act
      const result = await userService.login(email, password);

      // Assert
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe(email);
      expect(result.user).not.toHaveProperty("password");
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });

    it("deve rejeitar se usuário não existir", async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.login(email, password))
        .rejects
        .toThrow(new AuthError("Invalid email or password"));
    });

    it("deve rejeitar se usuário não tiver senha", async () => {
      // Arrange
      const userWithoutPassword = { ...mockUser, password: undefined };
      mockUserRepository.findByEmail.mockResolvedValue(userWithoutPassword as any);

      // Act & Assert
      await expect(userService.login(email, password))
        .rejects
        .toThrow(new AuthError("Invalid email or password"));
    });

    it("deve rejeitar senha incorreta", async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(userService.login(email, password))
        .rejects
        .toThrow(new AuthError("Invalid email or password"));
    });
  });

  describe("getUserById", () => {
    const input = {
      requesterId: 1,
      requesterRole: "patient" as UserRole,
      targetUserId: 1,
    };

    it("deve retornar usuário quando paciente busca por si mesmo", async () => {
      // Arrange
      mockUserRepository.findWithDetailsById.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById(input);

      // Assert
      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty("password");
    });

    it("deve rejeitar quando paciente tenta acessar outro usuário", async () => {
      // Arrange
      const inputOtherUser = { ...input, targetUserId: 2 };

      // Act & Assert
      await expect(userService.getUserById(inputOtherUser))
        .rejects
        .toThrow(new ForbiddenError("Você não tem permissão para acessar este usuário"));
    });

    it("deve rejeitar se usuário não for encontrado", async () => {
      // Arrange
      mockUserRepository.findWithDetailsById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(input))
        .rejects
        .toThrow(new NotFoundError("Usuário não encontrado"));
    });

    it("deve permitir acesso para admin", async () => {
      // Arrange
      const adminInput = {
        ...input,
        requesterRole: "clinic_admin" as UserRole,
        targetUserId: 2,
      };
      mockUserRepository.findWithDetailsById.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById(adminInput);

      // Assert
      expect(result).toEqual(mockUserWithoutPassword);
    });
  });

  describe("getUserByIdScoped", () => {
    const input = {
      clinicId: 1,
      requester: { id: 1, role: "patient", clinic_id: 1 },
      targetUserId: 1,
    };

    it("deve permitir usuário buscar por si mesmo", async () => {
      // Arrange
      mockUserRepository.findWithDetailsById.mockResolvedValue({
        ...mockUser,
        clinic_id: 1,
      });

      // Act
      const result = await userService.getUserByIdScoped(input);

      // Assert
      expect(result).not.toHaveProperty("password");
      expect(mockUserRepository.findWithDetailsById).toHaveBeenCalledWith(1);
    });

    it("deve rejeitar se não for próprio usuário nem admin", async () => {
      // Arrange
      const inputOtherUser = { ...input, targetUserId: 2 };

      // Act & Assert
      await expect(userService.getUserByIdScoped(inputOtherUser))
        .rejects
        .toThrow(new ForbiddenError("Forbidden"));
    });

    it("deve permitir clinic_admin acessar outros usuários da mesma clínica", async () => {
      // Arrange
      const adminInput = {
        clinicId: 1,
        requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
        targetUserId: 1,
      };
      mockUserRepository.findWithDetailsById.mockResolvedValue({
        ...mockUser,
        clinic_id: 1,
      });

      // Act
      const result = await userService.getUserByIdScoped(adminInput);

      // Assert
      expect(result).not.toHaveProperty("password");
    });

    it("deve rejeitar se admin tentar acessar usuário de outra clínica", async () => {
      // Arrange
      const adminInput = {
        clinicId: 2, // Clínica diferente
        requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
        targetUserId: 1,
      };

      // Act & Assert
      await expect(userService.getUserByIdScoped(adminInput))
        .rejects
        .toThrow(new ForbiddenError("Forbidden"));
    });

    it("deve permitir system_admin acessar qualquer usuário", async () => {
      // Arrange
      const systemAdminInput = {
        clinicId: 2,
        requester: { id: 3, role: "system_admin", clinic_id: null },
        targetUserId: 1,
      };
      mockUserRepository.findWithDetailsById.mockResolvedValue({
        ...mockUser,
        clinic_id: 2,
      });

      // Act
      const result = await userService.getUserByIdScoped(systemAdminInput);

      // Assert
      expect(result).not.toHaveProperty("password");
    });

    it("deve rejeitar se usuário não for encontrado", async () => {
      // Arrange
      mockUserRepository.findWithDetailsById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserByIdScoped(input))
        .rejects
        .toThrow(new NotFoundError("Usuário não encontrado"));
    });
  });

  describe("listUsersByClinic", () => {
    const input = {
      clinicId: 1,
      requester: { id: 1, role: "clinic_admin", clinic_id: 1 },
      filters: { role: "patient", page: 1, pageSize: 10 },
    };

    const mockResult = {
      items: [mockUser],
      pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    };

    it("deve listar usuários para clinic_admin", async () => {
      // Arrange
      mockUserRepository.listByClinicIdPaginated.mockResolvedValue(mockResult);

      // Act
      const result = await userService.listUsersByClinic(input);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).not.toHaveProperty("password");
      expect(mockUserRepository.listByClinicIdPaginated).toHaveBeenCalledWith(1, input.filters);
    });

    it("deve rejeitar se usuário não estiver autenticado", async () => {
      // Arrange
      const inputWithoutRequester = { ...input, requester: undefined };

      // Act & Assert
      await expect(userService.listUsersByClinic(inputWithoutRequester))
        .rejects
        .toThrow(new AuthError("User not authenticated"));
    });

    it("deve rejeitar se role não for permitida", async () => {
      // Arrange
      const inputWithPatient = {
        ...input,
        requester: { id: 1, role: "patient", clinic_id: 1 },
      };

      // Act & Assert
      await expect(userService.listUsersByClinic(inputWithPatient))
        .rejects
        .toThrow(new AuthError("Forbidden"));
    });

    it("deve permitir system_admin acessar qualquer clínica", async () => {
      // Arrange
      const systemAdminInput = {
        clinicId: 2,
        requester: { id: 1, role: "system_admin", clinic_id: null },
        filters: {},
      };
      mockUserRepository.listByClinicIdPaginated.mockResolvedValue(mockResult);

      // Act
      const result = await userService.listUsersByClinic(systemAdminInput);

      // Assert
      expect(result.items).toHaveLength(1);
    });

    it("deve rejeitar se clinic_admin tentar acessar outra clínica", async () => {
      // Arrange
      const inputWrongClinic = {
        ...input,
        clinicId: 2, // Clínica diferente
      };

      // Act & Assert
      await expect(userService.listUsersByClinic(inputWrongClinic))
        .rejects
        .toThrow(new AuthError("Forbidden"));
    });
  });

  describe("updateUserScoped", () => {
    const input = {
      clinicId: 1,
      requester: { id: 1, role: "patient", clinic_id: 1 },
      targetUserId: 1,
      data: { name: "Novo Nome", email: "novo@email.com" },
    };

    beforeEach(() => {
      mockValidators.isValidEmail.mockReturnValue(true);
      mockValidators.isValidPhone.mockReturnValue(true);
      mockValidators.isValidPassword.mockReturnValue(true);
    });

    it("deve permitir usuário atualizar próprios dados", async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findWithDetailsById.mockResolvedValue(mockUser);
      mockBcrypt.hash.mockResolvedValue("newHashedPassword" as never);

      // Act
      await userService.updateUserScoped(input);

      // Assert
      expect(mockUserRepository.updateById).toHaveBeenCalledWith(1, {
        name: "Novo Nome",
        email: "novo@email.com",
      });
    });

    it("deve rejeitar tentativa de alterar role", async () => {
      // Arrange
      const inputWithRole = {
        ...input,
        data: { ...input.data, role: "admin" },
      };
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.updateUserScoped(inputWithRole))
        .rejects
        .toThrow(new ForbiddenError("Não é permitido alterar role"));
    });

    it("deve permitir apenas o próprio usuário alterar senha", async () => {
      // Arrange
      const inputWithPassword = {
        ...input,
        data: { password: "NovaSenha123@" },
      };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findWithDetailsById.mockResolvedValue(mockUser);
      mockBcrypt.hash.mockResolvedValue("newHashedPassword" as never);

      // Act
      await userService.updateUserScoped(inputWithPassword);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith("NovaSenha123@", 10);
    });

    it("deve rejeitar admin tentando alterar senha de outro usuário", async () => {
      // Arrange
      const adminInput = {
        clinicId: 1,
        requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
        targetUserId: 1,
        data: { password: "NovaSenha123@" },
      };
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.updateUserScoped(adminInput))
        .rejects
        .toThrow(new ForbiddenError("Não é permitido alterar password"));
    });

    it("deve validar formato de email", async () => {
      // Arrange
      const inputWithInvalidEmail = {
        ...input,
        data: { email: "email-invalido" },
      };
      mockValidators.isValidEmail.mockReturnValue(false);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.updateUserScoped(inputWithInvalidEmail))
        .rejects
        .toThrow(new ValidationError("Invalid email format"));
    });

    it("deve rejeitar se não houver campos válidos para atualizar", async () => {
      // Arrange
      const inputEmpty = {
        ...input,
        data: {},
      };
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.updateUserScoped(inputEmpty))
        .rejects
        .toThrow(new ValidationError("Nenhum campo válido para atualizar"));
    });
  });

  describe("deleteUser", () => {
    const input = {
      clinicId: 1,
      requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
      targetUserId: 1,
    };

    it("deve deletar usuário com sucesso", async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockAppointmentRepository.checkActiveAppointments.mockResolvedValue(false);

      // Act
      await userService.deleteUser(input);

      // Assert
      expect(mockUserRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it("deve rejeitar se role não for permitida", async () => {
      // Arrange
      const inputWithPatient = {
        ...input,
        requester: { id: 1, role: "patient", clinic_id: 1 },
      };

      // Act & Assert
      await expect(userService.deleteUser(inputWithPatient))
        .rejects
        .toThrow(new ForbiddenError("Forbidden"));
    });

    it("deve rejeitar tentativa de deletar próprio usuário", async () => {
      // Arrange
      const inputSelfDelete = {
        ...input,
        requester: { id: 1, role: "clinic_admin", clinic_id: 1 },
      };

      // Act & Assert
      await expect(userService.deleteUser(inputSelfDelete))
        .rejects
        .toThrow(new ValidationError("Não é permitido excluir o próprio usuário"));
    });

    it("deve rejeitar se usuário tiver agendamentos ativos", async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockAppointmentRepository.checkActiveAppointments.mockResolvedValue(true);

      // Act & Assert
      await expect(userService.deleteUser(input))
        .rejects
        .toThrow(new ValidationError("Não é possível deletar o usuário pois ele possui agendamentos ativos."));
    });
  });

  describe("createUserByAdmin", () => {
    const input = {
      clinicId: 1,
      requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
      data: {
        name: "Novo Usuário",
        email: "novo@teste.com",
        password: "MinhaSenh@123",
        role: "receptionist" as UserRole,
        cpf: "12345678901",
        phone: "11999999999",
      },
    };

    beforeEach(() => {
      mockValidators.isValidEmail.mockReturnValue(true);
      mockValidators.isValidCpfLogic.mockReturnValue(true);
      mockValidators.isValidPhone.mockReturnValue(true);
      mockValidators.isValidPassword.mockReturnValue(true);
    });

    it("deve criar usuário com sucesso", async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.create.mockResolvedValue(3);
      mockUserRepository.findById.mockResolvedValue({
        ...input.data,
        id: 3,
        clinic_id: 1,
        password: "hashedPassword",
      });

      // Act
      const result = await userService.createUserByAdmin(input);

      // Assert
      expect(result.user).not.toHaveProperty("password");
      expect(result.generatedPassword).toBeUndefined(); // Senha foi fornecida
    });

    it("deve gerar senha automaticamente se não fornecida", async () => {
      // Arrange
      const inputWithoutPassword = {
        ...input,
        data: { ...input.data, password: undefined },
      };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.create.mockResolvedValue(3);
      mockUserRepository.findById.mockResolvedValue({
        ...inputWithoutPassword.data,
        id: 3,
        clinic_id: 1,
        password: "hashedPassword",
      });

      // Act
      const result = await userService.createUserByAdmin(inputWithoutPassword);

      // Assert
      expect(result.generatedPassword).toBeDefined();
      expect(typeof result.generatedPassword).toBe("string");
      expect(result.generatedPassword?.length).toBe(12);
    });

    it("deve rejeitar se não for admin", async () => {
      // Arrange
      const inputWithPatient = {
        ...input,
        requester: { id: 1, role: "patient", clinic_id: 1 },
      };

      // Act & Assert
      await expect(userService.createUserByAdmin(inputWithPatient))
        .rejects
        .toThrow(new ForbiddenError("Apenas administradores podem criar usuários."));
    });

    it("deve rejeitar clinic_admin tentando criar system_admin", async () => {
      // Arrange
      const inputSystemAdmin = {
        ...input,
        data: { ...input.data, role: "system_admin" as UserRole },
      };

      // Act & Assert
      await expect(userService.createUserByAdmin(inputSystemAdmin))
        .rejects
        .toThrow(new ForbiddenError("Administradores de clínica não podem criar administradores de sistema."));
    });

    it("deve validar campos obrigatórios", async () => {
      // Arrange
      const inputWithoutName = {
        ...input,
        data: { ...input.data, name: "" },
      };

      // Act & Assert
      await expect(userService.createUserByAdmin(inputWithoutName))
        .rejects
        .toThrow(new ValidationError("Nome, email, role e CPF são obrigatórios."));
    });

    it("deve rejeitar email já em uso", async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.createUserByAdmin(input))
        .rejects
        .toThrow(new ValidationError("Email já está em uso."));
    });
  });

  describe("generateToken (método privado)", () => {
    it("deve gerar token corretamente", async () => {
      // Arrange
      mockJwt.sign.mockReturnValue("fake_token" as never);

      // Act - testamos indiretamente através do login
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await userService.login("joao@teste.com", "senha123");

      // Assert
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          clinic_id: mockUser.clinic_id,
        },
        "test_secret",
        { expiresIn: "24h" }
      );
      expect(result.token).toBe("fake_token");
    });
  });
});