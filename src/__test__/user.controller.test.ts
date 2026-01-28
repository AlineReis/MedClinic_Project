import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";

import { UserController } from "../controller/user.controller.js";
import { UserService } from "../services/user.service.js";
import { AuthError } from "../utils/errors.js";

// --- Magia do TypeScript: Inferência de Tipos ---
// Extrai o tipo de retorno da Promise do método listUsersByClinic
type ServiceResponse = Awaited<ReturnType<UserService["listUsersByClinic"]>>;
type PaginatedUsers = ServiceResponse;
// Extrai o tipo de um único item dentro do array 'items'
type UserItem = ServiceResponse["items"][number];

// --- Tipos (Mantidos para contexto) ---

type ListUsersByClinicParams = {
  clinicId: number;
  requester: { id: number; role: string; clinic_id?: number };
  filters: {
    role: string;
    search?: string;
    page: number;
    pageSize: number;
  };
};

type QueryParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  role?: string;
};

const makeMockRes = () => {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnThis();
  return { status, json } as unknown as Response;
};

// --- Mock Setup ---

// Define o resultado padrão de sucesso para evitar repetição nos testes
const defaultPaginatedResult: PaginatedUsers = {
  items: [
    {
      id: 1,
      name: "Dr. Example",
      email: "doctor@example.com",
      role: "health_professional",
      clinic_id: 42, // O TS agora aceita pois ele "leu" o retorno do seu service
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cpf: "000.000.000-00",
    } as UserItem,
  ],
  page: 2,
  pageSize: 5,
  total: 1,
  totalPages: 1,
};

// Cria o objeto Mock.
// Dica: Se você tiver a interface do UserService, pode usar: jest.Mocked<UserService>
const mockUserService = {
  listUsersByClinic: jest.fn(),
  updateUserScoped: jest.fn(),
} as unknown as jest.Mocked<UserService>;

describe("UserController.listByClinic", () => {
  let controller: UserController;

  const defaultRequester = {
    id: 99,
    role: "clinic_admin",
    clinic_id: 42,
    name: "Admin",
    email: "admin@example.com",
  };

  // Helper para criar request/response
  const makeRequest = ({
    query = { page: "2", pageSize: "5" },
    user = defaultRequester,
    params = { clinic_id: "42" },
  }: {
    query?: QueryParams;
    user?: typeof defaultRequester;
    params?: Record<string, string>;
  } = {}) => {
    const mockReq = {
      params,
      query,
      user: { ...user } as any,
    } as Partial<Request>;

    const jsonSpy = jest.fn();
    const statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });

    const mockRes = {
      status: statusSpy as unknown as jest.Mock,
    } as Partial<Response>;

    const nextFn = jest.fn() as unknown as NextFunction;

    return {
      req: mockReq as Request,
      res: mockRes as Response,
      next: nextFn,
      statusSpy,
      jsonSpy,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Limpa chamadas anteriores e resets de estado
    // Injeta o mock no controller
    controller = new UserController(mockUserService as any);
  });

  it("should return paginated results with expected structure", async () => {
    // Arrange: Configura o mock para resolver com sucesso
    mockUserService.listUsersByClinic.mockResolvedValue(defaultPaginatedResult);

    const { req, res, next, statusSpy, jsonSpy } = makeRequest();

    // Act
    await controller.listByClinic(req, res, next);

    // Assert
    expect(statusSpy).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: true,
      users: defaultPaginatedResult,
    });
  });

  it("should pass converted query filters to the service", async () => {
    mockUserService.listUsersByClinic.mockResolvedValue(defaultPaginatedResult);
    const { req, res, next } = makeRequest();

    await controller.listByClinic(req, res, next);

    expect(mockUserService.listUsersByClinic).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: 42,
        requester: expect.objectContaining({
          id: 99,
          role: "clinic_admin",
          clinic_id: 42,
        }),
        filters: expect.objectContaining({
          page: 2,
          pageSize: 5,
        }),
      }),
    );
  });

  it("should call next with error if service fails", async () => {
    const { req, res, next } = makeRequest();
    const error = new Error("Service Failure");

    // Arrange: Força o mock a rejeitar (erro)
    mockUserService.listUsersByClinic.mockRejectedValue(error);

    await controller.listByClinic(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("should use default pagination values when query is empty", async () => {
    mockUserService.listUsersByClinic.mockResolvedValue(defaultPaginatedResult);
    const { res, next } = makeRequest();

    const reqWithoutQuery = {
      params: { clinic_id: "42" },
      query: {},
      user: { id: 99, role: "clinic_admin", clinic_id: 42 },
    } as unknown as Request;

    await controller.listByClinic(reqWithoutQuery, res, next);

    expect(mockUserService.listUsersByClinic).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          page: 1,
          pageSize: 10,
        }),
      }),
    );
  });

  it("should pass search and role filters when they are provided in the query", async () => {
    mockUserService.listUsersByClinic.mockResolvedValue(defaultPaginatedResult);
    const { res, next } = makeRequest();

    const reqWithFilters = {
      params: { clinic_id: "42" },
      query: {
        page: "1",
        pageSize: "10",
        search: "John Doe",
        role: "admin",
      },
      user: { id: 99, role: "clinic_admin", clinic_id: 42 },
    } as unknown as Request;

    await controller.listByClinic(reqWithFilters, res, next);

    expect(mockUserService.listUsersByClinic).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          search: "John Doe",
          role: "admin",
        }),
      }),
    );
  });

  it("should reject patients (403) when they call the endpoint", async () => {
    // Arrange: Simulamos que o serviço rejeita com AuthError quando é paciente
    // Nota: Em testes com Mocks, nós controlamos o resultado. Se a lógica de Auth
    // fica no serviço, simulamos o erro do serviço.
    mockUserService.listUsersByClinic.mockRejectedValue(
      new AuthError("Forbidden"),
    );

    const { req, res, next, statusSpy, jsonSpy } = makeRequest({
      user: { ...defaultRequester, role: "patient" },
    });

    await controller.listByClinic(req, res, next);

    expect(mockUserService.listUsersByClinic).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(AuthError));
    expect(statusSpy).not.toHaveBeenCalled();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it("should include the role query filter when provided", async () => {
    mockUserService.listUsersByClinic.mockResolvedValue(defaultPaginatedResult);
    const { req, res, next } = makeRequest({
      query: { role: "health_professional", page: "1", pageSize: "10" },
    });

    await controller.listByClinic(req, res, next);

    expect(mockUserService.listUsersByClinic).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ role: "health_professional" }),
      }),
    );
  });

  describe("Input Validation & Security (To Be Implemented)", () => {
    it.skip("should handle invalid pagination strings by falling back to defaults", async () => {
      mockUserService.listUsersByClinic.mockResolvedValue(
        defaultPaginatedResult,
      );
      const { res, next } = makeRequest();

      const reqWithGarbage = {
        params: { clinic_id: "42" },
        query: { page: "not-a-number", pageSize: "undefined" },
        user: { id: 99, role: "clinic_admin", clinic_id: 42 },
      } as unknown as Request;

      await controller.listByClinic(reqWithGarbage, res, next);

      expect(mockUserService.listUsersByClinic).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ page: 1, pageSize: 10 }),
        }),
      );
    });

    it.skip("should throw an error if requester tries to access a different clinic_id", async () => {
      const { res, next } = makeRequest();

      // Aqui não precisamos configurar o mock do serviço, pois o controller deve barrar antes

      const maliciousReq = {
        params: { clinic_id: "999" },
        query: {},
        user: { id: 99, role: "clinic_admin", clinic_id: 42 },
      } as unknown as Request;

      await controller.listByClinic(maliciousReq, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Forbidden"),
        }),
      );
    });

    it.skip("should ignore search filter if it is an empty string", async () => {
      mockUserService.listUsersByClinic.mockResolvedValue(
        defaultPaginatedResult,
      );
      const { res, next } = makeRequest();

      const reqWithEmptySearch = {
        params: { clinic_id: "42" },
        query: { search: "   " },
        user: { id: 99, role: "clinic_admin", clinic_id: 42 },
      } as unknown as Request;

      await controller.listByClinic(reqWithEmptySearch, res, next);

      const [callArgs] = mockUserService.listUsersByClinic.mock.calls[0] as [
        ListUsersByClinicParams,
      ];
      expect(callArgs.filters.search).toBeUndefined();
    });

    it.skip("should not pass unknown query parameters to the service", async () => {
      mockUserService.listUsersByClinic.mockResolvedValue(
        defaultPaginatedResult,
      );
      const { res, next } = makeRequest();

      const reqWithExtraParams = {
        params: { clinic_id: "42" },
        query: { page: "1", admin: "true", delete_all: "1" },
        user: { id: 99, role: "clinic_admin", clinic_id: 42 },
      } as unknown as Request;

      await controller.listByClinic(reqWithExtraParams, res, next);

      expect(mockUserService.listUsersByClinic).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {
            page: 1,
            pageSize: 10,
          },
        }),
      );
    });
  });

  describe("update (PUT /users/:id)", () => {
    const makeUpdateRequest = ({
      body = { name: "New Name", email: "new@email.com" },
      user = defaultRequester,
      params = { clinic_id: "42", id: "99" },
    }: {
      body?: Record<string, any>;
      user?: typeof defaultRequester;
      params?: Record<string, string>;
    } = {}) => {
      const req = {
        params,
        query: {},
        body,
        user: { ...user } as any,
      } as Partial<Request>;

      const res = makeMockRes();
      const next = jest.fn() as unknown as NextFunction;

      return { req: req as Request, res, next };
    };

    it("allows user to update own name/email only", async () => {
      mockUserService.updateUserScoped.mockResolvedValue({
        ...defaultPaginatedResult.items[0],
        name: "New Name",
        email: "new@email.com",
        cpf: "000.000.000-00",
      });

      const { req, res, next } = makeUpdateRequest();

      await controller.update(req, res, next);

      expect(mockUserService.updateUserScoped).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicId: 42,
          requester: expect.objectContaining({
            id: 99,
            role: "clinic_admin",
            clinic_id: 42,
          }),
          targetUserId: 99,
          data: { name: "New Name", email: "new@email.com" },
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: expect.objectContaining({
          name: "New Name",
          email: "new@email.com",
        }),
        message: "Usuário atualizado com sucesso",
      });
    });
  });
});
