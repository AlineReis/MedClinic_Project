export type UserRole =
  | "patient"
  | "receptionist"
  | "lab_tech"
  | "health_professional"
  | "clinic_admin"
  | "system_admin";

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  cpf?: string;
  phone?: string;
  clinic_id?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  cpf: string;
  phone?: string;
}
