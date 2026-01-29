import { InMemoryUserRepository } from "../repository/users-in-memory.repository.js";

//verifica que o soft delete marca deleted_at, mas esconde o usuário das consultas
describe("InMemoryUserRepository soft delete", () => {
  it("should mask deleted users after soft delete", async () => {
    const repository = new InMemoryUserRepository();

    const userId = await repository.create({
      name: "Joao Silva",
      email: "joao@medclinic.com",
      password: "TestPass123!",
      role: "patient" as any,
      cpf: "123.456.789-10",
      phone: "(11) 98765-4321",
      clinic_id: 1,
    } as any);

    await repository.deleteById(userId);

    const internalUsers = (repository as any).users;
    expect(internalUsers).toHaveLength(1);
    expect(internalUsers[0].deleted_at).not.toBeNull();

    await expect(repository.findById(userId)).resolves.toBeNull();

    const result = await repository.listByClinicIdPaginated(1, {});
    expect(result.items).toHaveLength(0);
  });
});
