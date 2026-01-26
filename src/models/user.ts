export const USER_ROLES = [
  "patient",
  "receptionist",
  "lab_tech",
  "health_professional",
  "clinic_admin",
  "system_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  cpf: string;
  phone?: string;
  created_at?: string;
  updated_at?: string | null;
}

export type CreateUserPayload = Omit<User, "id" | "created_at" | "updated_at">;
export type AuthResult = Pick<User, "id" | "name" | "email" | "role">;
