import { jest } from '@jest/globals';
import { UserService } from "../services/user.service.js";
import type { IUserRepository } from "../repository/iuser.repository.js";
import { User, UserRole } from "../models/user.js";
import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

/**
 * 📋 TESTES UNITÁRIOS SIMPLIFICADOS - USER SERVICE
 *
 * Este arquivo demonstra como criar testes unitários eficientes
 * testando todos os caminhos de código (if/else) do UserService.
 */
describe("UserService - Testes Simplificados", () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockAppointmentRepository: any;

  // 📝 Dados de teste reutilizáveis
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

  beforeEach(() => {
    // 🔄 Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();

    // 🎭 Criar mock do repositório de usuários
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

    // 🎭 Criar mock do repositório de agendamentos
    mockAppointmentRepository = {
      checkActiveAppointments: jest.fn(),
    };

    // 🏗️ Instanciar o serviço com mocks
    userService = new UserService(mockUserRepository, mockAppointmentRepository);

    // 🔧 Mock das validações (simulamos que sempre passam)
    (global as any).isValidEmail = jest.fn().mockReturnValue(true);
    (global as any).isValidPassword = jest.fn().mockReturnValue(true);
    (global as any).isValidCpfLogic = jest.fn().mockReturnValue(true);
  });

  describe("🔐 getUserById - Controle de Acesso", () => {
    const input = {
      requesterId: 1,
      requesterRole: "patient" as UserRole,
      targetUserId: 1,
    };

    it("✅ deve permitir paciente acessar próprio perfil", async () => {
      // 🔧 ARRANGE: Configurar dados
      mockUserRepository.findWithDetailsById.mockResolvedValue(mockUser);

      // ⚡ ACT: Executar método
      const result = await userService.getUserById(input);

      // ✅ ASSERT: Verificar resultado
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty("password"); // Senha deve ser removida
      expect(mockUserRepository.findWithDetailsById).toHaveBeenCalledWith(1);
    });

    it("❌ deve rejeitar paciente tentando acessar outro usuário", async () => {
      // 🔧 ARRANGE: Paciente tentando acessar outro usuário
      const inputOtherUser = { ...input, targetUserId: 2 };

      // ⚡ ACT & ✅ ASSERT: Deve lançar erro
      await expect(userService.getUserById(inputOtherUser))
        .rejects
        .toThrow(new ForbiddenError("Você não tem permissão para acessar este usuário"));
    });

    it("❌ deve rejeitar se usuário não for encontrado", async () => {
      // 🔧 ARRANGE: Repositório retorna null
      mockUserRepository.findWithDetailsById.mockResolvedValue(null);

      // ⚡ ACT & ✅ ASSERT: Deve lançar NotFoundError
      await expect(userService.getUserById(input))
        .rejects
        .toThrow(new NotFoundError("Usuário não encontrado"));
    });

    it("✅ deve permitir clinic_admin acessar qualquer usuário", async () => {
      // 🔧 ARRANGE: Admin acessando outro usuário
      const adminInput = {
        ...input,
        requesterRole: "clinic_admin" as UserRole,
        targetUserId: 2,
      };
      mockUserRepository.findWithDetailsById.mockResolvedValue(mockUser);

      // ⚡ ACT: Admin pode acessar
      const result = await userService.getUserById(adminInput);

      // ✅ ASSERT: Sucesso
      expect(result).toBeDefined();
    });
  });

  describe("🏥 getUserByIdScoped - Controle por Clínica", () => {
    const input = {
      clinicId: 1,
      requester: { id: 1, role: "patient", clinic_id: 1 },
      targetUserId: 1,
    };

    it("✅ deve permitir usuário buscar por si mesmo", async () => {
      // 🔧 ARRANGE
      mockUserRepository.findWithDetailsById.mockResolvedValue({
        ...mockUser,
        clinic_id: 1,
      });

      // ⚡ ACT
      const result = await userService.getUserByIdScoped(input);

      // ✅ ASSERT
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty("password");
    });

    it("❌ deve rejeitar se não for próprio usuário nem admin", async () => {
      // 🔧 ARRANGE: Usuário tentando acessar outro
      const inputOtherUser = { ...input, targetUserId: 2 };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.getUserByIdScoped(inputOtherUser))
        .rejects
        .toThrow(new ForbiddenError("Forbidden"));
    });

    it("✅ deve permitir clinic_admin acessar usuários da mesma clínica", async () => {
      // 🔧 ARRANGE: Admin da mesma clínica
      const adminInput = {
        clinicId: 1,
        requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
        targetUserId: 1,
      };
      mockUserRepository.findWithDetailsById.mockResolvedValue({
        ...mockUser,
        clinic_id: 1,
      });

      // ⚡ ACT
      const result = await userService.getUserByIdScoped(adminInput);

      // ✅ ASSERT
      expect(result).toBeDefined();
    });

    it("❌ deve rejeitar admin acessando usuário de outra clínica", async () => {
      // 🔧 ARRANGE: Admin tentando acessar outra clínica
      const adminInput = {
        clinicId: 2, // Clínica diferente!
        requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
        targetUserId: 1,
      };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.getUserByIdScoped(adminInput))
        .rejects
        .toThrow(new ForbiddenError("Forbidden"));
    });

    it("✅ deve permitir system_admin acessar qualquer usuário/clínica", async () => {
      // 🔧 ARRANGE: System admin pode tudo
      const systemAdminInput = {
        clinicId: 2,
        requester: { id: 3, role: "system_admin", clinic_id: null },
        targetUserId: 1,
      };
      mockUserRepository.findWithDetailsById.mockResolvedValue({
        ...mockUser,
        clinic_id: 2, // Clínica diferente, mas system_admin pode
      });

      // ⚡ ACT
      const result = await userService.getUserByIdScoped(systemAdminInput);

      // ✅ ASSERT
      expect(result).toBeDefined();
    });

    it("❌ deve rejeitar se usuário não existir", async () => {
      // 🔧 ARRANGE
      mockUserRepository.findWithDetailsById.mockResolvedValue(null);

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.getUserByIdScoped(input))
        .rejects
        .toThrow(new NotFoundError("Usuário não encontrado"));
    });
  });

  describe("📋 listUsersByClinic - Listar Usuários", () => {
    const input = {
      clinicId: 1,
      requester: { id: 1, role: "clinic_admin", clinic_id: 1 },
      filters: { role: "patient", page: 1, pageSize: 10 },
    };

    const mockResult = {
      items: [mockUser],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    };

    it("✅ deve listar usuários para clinic_admin", async () => {
      // 🔧 ARRANGE
      mockUserRepository.listByClinicIdPaginated.mockResolvedValue(mockResult);

      // ⚡ ACT
      const result = await userService.listUsersByClinic(input);

      // ✅ ASSERT
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).not.toHaveProperty("password");
      expect(mockUserRepository.listByClinicIdPaginated).toHaveBeenCalledWith(1, input.filters);
    });

    it("❌ deve rejeitar se usuário não estiver autenticado", async () => {
      // 🔧 ARRANGE: Sem requester
      const inputSemAuth = { ...input, requester: undefined };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.listUsersByClinic(inputSemAuth))
        .rejects
        .toThrow(new AuthError("User not authenticated"));
    });

    it("❌ deve rejeitar se role não for permitida", async () => {
      // 🔧 ARRANGE: Paciente tentando listar usuários
      const inputPaciente = {
        ...input,
        requester: { id: 1, role: "patient", clinic_id: 1 },
      };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.listUsersByClinic(inputPaciente))
        .rejects
        .toThrow(new AuthError("Forbidden"));
    });

    it("✅ deve permitir system_admin acessar qualquer clínica", async () => {
      // 🔧 ARRANGE: System admin pode acessar qualquer clínica
      const systemAdminInput = {
        clinicId: 999, // Clínica qualquer
        requester: { id: 1, role: "system_admin", clinic_id: null },
        filters: {},
      };
      mockUserRepository.listByClinicIdPaginated.mockResolvedValue(mockResult);

      // ⚡ ACT
      const result = await userService.listUsersByClinic(systemAdminInput);

      // ✅ ASSERT
      expect(result.items).toHaveLength(1);
    });

    it("❌ deve rejeitar clinic_admin tentando acessar outra clínica", async () => {
      // 🔧 ARRANGE: Admin tentando acessar clínica diferente
      const inputOutraClinica = {
        ...input,
        clinicId: 2, // Clínica diferente da do admin
      };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.listUsersByClinic(inputOutraClinica))
        .rejects
        .toThrow(new AuthError("Forbidden"));
    });

    it("❌ deve rejeitar se requester não tiver clinic_id", async () => {
      // 🔧 ARRANGE: Admin sem clinic_id
      const inputSemClinica = {
        ...input,
        requester: { id: 1, role: "clinic_admin", clinic_id: null },
      };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.listUsersByClinic(inputSemClinica))
        .rejects
        .toThrow(new AuthError("Forbidden"));
    });
  });

  describe("🗑️ deleteUser - Excluir Usuário", () => {
    const input = {
      clinicId: 1,
      requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
      targetUserId: 1,
    };

    it("✅ deve deletar usuário com sucesso", async () => {
      // 🔧 ARRANGE
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockAppointmentRepository.checkActiveAppointments.mockResolvedValue(false);

      // ⚡ ACT
      await userService.deleteUser(input);

      // ✅ ASSERT
      expect(mockUserRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it("❌ deve rejeitar se role não for permitida", async () => {
      // 🔧 ARRANGE: Paciente tentando deletar
      const inputPaciente = {
        ...input,
        requester: { id: 1, role: "patient", clinic_id: 1 },
      };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.deleteUser(inputPaciente))
        .rejects
        .toThrow(new ForbiddenError("Forbidden"));
    });

    it("❌ deve rejeitar tentativa de deletar próprio usuário", async () => {
      // 🔧 ARRANGE: Admin tentando deletar a si mesmo
      const inputAutoDelete = {
        ...input,
        requester: { id: 1, role: "clinic_admin", clinic_id: 1 },
        targetUserId: 1, // Mesmo ID do requester
      };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.deleteUser(inputAutoDelete))
        .rejects
        .toThrow(new ValidationError("Não é permitido excluir o próprio usuário"));
    });

    it("❌ deve rejeitar se usuário não existir", async () => {
      // 🔧 ARRANGE
      mockUserRepository.findById.mockResolvedValue(null);

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.deleteUser(input))
        .rejects
        .toThrow(new NotFoundError("Usuário não encontrado"));
    });

    it("❌ deve rejeitar se usuário tiver agendamentos ativos", async () => {
      // 🔧 ARRANGE
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockAppointmentRepository.checkActiveAppointments.mockResolvedValue(true); // Tem agendamentos

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.deleteUser(input))
        .rejects
        .toThrow(new ValidationError("Não é possível deletar o usuário pois ele possui agendamentos ativos."));
    });

    it("✅ deve permitir system_admin deletar em qualquer clínica", async () => {
      // 🔧 ARRANGE
      const systemAdminInput = {
        clinicId: 999,
        requester: { id: 3, role: "system_admin", clinic_id: null },
        targetUserId: 1,
      };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockAppointmentRepository.checkActiveAppointments.mockResolvedValue(false);

      // ⚡ ACT
      await userService.deleteUser(systemAdminInput);

      // ✅ ASSERT
      expect(mockUserRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it("❌ deve rejeitar clinic_admin tentando deletar em outra clínica", async () => {
      // 🔧 ARRANGE
      const inputOutraClinica = {
        ...input,
        requester: { id: 2, role: "clinic_admin", clinic_id: 2 }, // Clínica diferente
      };

      // ⚡ ACT & ✅ ASSERT
      await expect(userService.deleteUser(inputOutraClinica))
        .rejects
        .toThrow(new ForbiddenError("Forbidden"));
    });
  });

  describe("📊 Cenários de Cobertura Completa", () => {
    it("🎯 deve testar todos os caminhos de getUserByIdScoped", async () => {
      // Este teste demonstra como verificar múltiplos cenários em sequência

      // ✅ Cenário 1: Próprio usuário (isSelf = true)
      const inputSelf = {
        clinicId: 1,
        requester: { id: 1, role: "patient", clinic_id: 1 },
        targetUserId: 1,
      };
      mockUserRepository.findWithDetailsById.mockResolvedValueOnce({ ...mockUser, clinic_id: 1 });

      const resultSelf = await userService.getUserByIdScoped(inputSelf);
      expect(resultSelf).toBeDefined();

      // ✅ Cenário 2: Admin (isAdmin = true)
      const inputAdmin = {
        clinicId: 1,
        requester: { id: 2, role: "clinic_admin", clinic_id: 1 },
        targetUserId: 1,
      };
      mockUserRepository.findWithDetailsById.mockResolvedValueOnce({ ...mockUser, clinic_id: 1 });

      const resultAdmin = await userService.getUserByIdScoped(inputAdmin);
      expect(resultAdmin).toBeDefined();

      // ❌ Cenário 3: Nem próprio nem admin (deve falhar)
      const inputForbidden = {
        clinicId: 1,
        requester: { id: 3, role: "patient", clinic_id: 1 },
        targetUserId: 1,
      };

      await expect(userService.getUserByIdScoped(inputForbidden))
        .rejects
        .toThrow(new ForbiddenError("Forbidden"));
    });
  });
});

/**
 * 📚 GUIA RÁPIDO PARA INICIANTES
 *
 * 1. **Como executar**: npm test user.service.simple.test.ts
 * 2. **O que testamos**: Todos os if/else e cenários de erro
 * 3. **Mocks**: Simulamos dependências externas (database, bcrypt, etc)
 * 4. **Padrão AAA**: Arrange (preparar) → Act (executar) → Assert (verificar)
 *
 * 💡 **Dica**: Cada teste deve verificar UM cenário específico!
 */