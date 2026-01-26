import { InMemoryUserRepository } from "../repository/users-in-memory.repository.js";
import { AuthService } from "../services/auth.service.js";
import { ConflictError } from "../utils/errors.js";
import { SecurityUtils } from "../utils/security.js";

describe("AuthService", () => {
  const jwtSecret = "test-secret";
  const jwtExpiresIn = "24h";

  const makeSut = () => {
    const repository = new InMemoryUserRepository();
    const service = new AuthService(repository);

    return { service, repository };
  };

  it("should register a patient with valid data", async () => {
    const { service } = makeSut();

    const user = await service.registerPatient({
      name: "Maria Silva",
      email: "maria@medclinic.com",
      password: "Senha@123",
      role: "patient",
      cpf: "123.456.789-10",
      phone: "(11) 98765-4321",
    });

    expect(user.id).toBe(1);
    expect(user.email).toBe("maria@medclinic.com");
    expect(user.role).toBe("patient");
  });

  it("should reject duplicated email", async () => {
    const { service } = makeSut();

    await service.registerPatient({
      name: "Maria Silva",
      email: "maria@medclinic.com",
      password: "Senha@123",
      role: "patient",
      cpf: "123.456.789-10",
      phone: "(11) 98765-4321",
    });

    await expect(
      service.registerPatient({
        name: "Maria Silva",
        email: "maria@medclinic.com",
        password: "Senha@123",
        role: "patient",
        cpf: "123.456.789-10",
        phone: "(11) 98765-4321",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should log in with valid credentials", async () => {
    const { repository, service } = makeSut();
    const password = "Senha@123";
    const email = "maria@medclinic.com";
    const hashedPassword = await SecurityUtils.hashPassword(password);

    await repository.create({
      name: "Maria Silva",
      email,
      password: hashedPassword,
      role: "patient",
      cpf: "123.456.789-10",
      phone: "(11) 98765-4321",
    });

    const result = await service.login(email, password);
    expect(typeof result.token).toBe("string");
    expect(result.user.email).toBe(email);
  });
});
