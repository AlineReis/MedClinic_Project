export type UserRole = 
  | 'patient' 
  | 'receptionist' 
  | 'lab_tech' 
  | 'health_professional' 
  | 'clinic_admin' 
  | 'system_admin';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  cpf?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}