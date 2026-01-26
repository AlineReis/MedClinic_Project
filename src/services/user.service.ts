import type { UserRepository } from "../repository/user.repository.js";
import { AuthError, ValidationError } from "../utils/errors.js";


//representa o usuário que fez a requisição (extraído do token JWT)
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
  constructor(private userRepository: UserRepository) {}

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

    const users = await this.userRepository.findByClinicId(clinicId);

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
