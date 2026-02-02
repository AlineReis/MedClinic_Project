/**
 * User management types for admin operations
 * Aligned with GET /users and GET /users/:id endpoints
 */

/**
 * User role enum matching backend contract
 */
export type UserRole =
  | "patient"
  | "receptionist"
  | "lab_tech"
  | "health_professional"
  | "clinic_admin"
  | "system_admin"

/**
 * Professional details for health_professional role
 */
export interface ProfessionalDetails {
  specialty: string
  registration_number: string
  council: string
  consultation_price: number
  commission_percentage?: number
}

/**
 * User summary for list views
 */
export interface UserSummary {
  id: number
  name: string
  email: string
  role: UserRole
  cpf: string
  phone?: string
  created_at: string
  professional_details?: ProfessionalDetails
}

/**
 * Detailed user information including timestamps
 */
export interface UserDetail extends UserSummary {
  updated_at: string
}

/**
 * Filter parameters for GET /users endpoint
 */
export interface UserFilters {
  role?: UserRole
  search?: string
  page?: number
  pageSize?: number
}

/**
 * Paginated response for user list
 */
export interface PaginatedUsers {
  users: UserSummary[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * Update user payload (PUT /users/:id)
 */
export interface UpdateUserPayload {
  name?: string
  email?: string
  phone?: string
  // Professional fields (only for health_professional role)
  specialty?: string
  registration_number?: string
  council?: string
  consultation_price?: number
}

/**
 * Create user payload (POST /users)
 */
export interface CreateUserPayload {
  name: string
  email: string
  password?: string
  role: UserRole
  cpf: string
  phone?: string
  // Professional fields
  specialty?: string
  registration_number?: string
  council?: string
  consultation_price?: number
  commission_percentage?: number
}

/**
 * Internal API response types (snake_case backend payloads)
 */
export interface UserApiItem {
  id: number
  name: string
  email: string
  role: UserRole
  cpf: string
  phone?: string
  created_at: string
  updated_at?: string
  professional_details?: {
    specialty: string
    registration_number: string
    council: string
    consultation_price: number
    commission_percentage?: number
  }
}

export interface UsersListApiResponse {
  success: true
  data: UserApiItem[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface UserDetailApiResponse {
  success: true
  user: UserApiItem
}

export interface UpdateUserApiResponse {
  success: true
  user: UserApiItem
  message: string
}
