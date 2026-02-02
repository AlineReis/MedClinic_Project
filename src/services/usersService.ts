/**
 * Users service for admin user management
 * Handles GET /users and GET /users/:id endpoints
 */

import { request } from "./apiService"
import type { ApiResponse } from "./apiService"
import type {
  UserSummary,
  UserDetail,
  UserFilters,
  PaginatedUsers,
  UpdateUserPayload,
  CreateUserPayload,
  UserApiItem,
  UsersListApiResponse,
  UserDetailApiResponse,
  UpdateUserApiResponse,
} from "../types/users"

/**
 * Build query string from user filters
 */
function buildUserQuery(filters: UserFilters = {}): string {
  const params = new URLSearchParams()

  if (filters.role) params.append("role", filters.role)
  if (filters.search) params.append("search", filters.search)
  if (filters.page) params.append("page", String(filters.page))
  if (filters.pageSize) params.append("pageSize", String(filters.pageSize))

  const query = params.toString()
  return query ? `?${query}` : ""
}

/**
 * Map API user item to UserSummary domain type
 */
function mapUserSummary(apiUser: UserApiItem): UserSummary {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    cpf: apiUser.cpf,
    phone: apiUser.phone,
    created_at: apiUser.created_at,
    professional_details: apiUser.professional_details
      ? {
          specialty: apiUser.professional_details.specialty,
          registration_number: apiUser.professional_details.registration_number,
          council: apiUser.professional_details.council,
          consultation_price: apiUser.professional_details.consultation_price,
          commission_percentage: apiUser.professional_details.commission_percentage,
        }
      : undefined,
  }
}

/**
 * Map API user item to UserDetail domain type
 */
function mapUserDetail(apiUser: UserApiItem): UserDetail {
  return {
    ...mapUserSummary(apiUser),
    updated_at: apiUser.updated_at || apiUser.created_at,
  }
}

/**
 * List users with optional filters and pagination
 * GET /users?role=&search=&page=&pageSize=
 *
 * Permissions: clinic_admin, receptionist (limited), system_admin
 *
 * @param filters Optional role, search, and pagination parameters
 * @returns Paginated list of users
 */
export async function listUsers(
  filters: UserFilters = {},
): Promise<ApiResponse<PaginatedUsers>> {
  const query = buildUserQuery(filters)
  const response = await request<UsersListApiResponse>(`/users${query}`)

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || {
        code: "UNKNOWN_ERROR",
        message: "Failed to fetch users",
        statusCode: 500,
      },
    }
  }

  // Map API response to domain types
  const users = response.data.data.map(mapUserSummary)

  return {
    success: true,
    data: {
      users,
      pagination: response.data.pagination,
    },
  }
}

/**
 * Get a specific user by ID
 * GET /users/:id
 *
 * Permissions:
 * - Patient: only their own data
 * - Health professional: their data + patients they attended
 * - Receptionist: any patient/professional
 * - Admin: all users
 *
 * @param userId User ID to fetch
 * @returns User details
 */
export async function getUserById(userId: number): Promise<ApiResponse<UserDetail>> {
  const response = await request<UserDetailApiResponse>(`/users/${userId}`)

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || {
        code: "UNKNOWN_ERROR",
        message: "Failed to fetch user",
        statusCode: 500,
      },
    }
  }

  return {
    success: true,
    data: mapUserDetail(response.data.user),
  }
}

/**
 * Create a new user
 * POST /users
 *
 * Permissions: admin only
 *
 * @param payload Create data
 * @returns Created user details
 */
export async function createUser(payload: CreateUserPayload): Promise<ApiResponse<UserDetail>> {
  const response = await request<UserDetailApiResponse>('/users', 'POST', payload);

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || {
        code: 'UNKNOWN_ERROR',
        message: 'Failed to create user',
        statusCode: 500
      }
    };
  }

  return {
    success: true,
    data: mapUserDetail(response.data.user)
  };
}

/**
 * Update user information
 * PUT /users/:id
 *
 * Permissions: admin or user themselves (limited fields)
 *
 * @param userId User ID to update
 * @param payload Update data (name, email, phone, professional fields)
 * @returns Updated user details
 */
export async function updateUser(
  userId: number,
  payload: UpdateUserPayload,
): Promise<ApiResponse<UserDetail>> {
  const response = await request<UpdateUserApiResponse>(`/users/${userId}`, "PUT", payload)

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || {
        code: "UNKNOWN_ERROR",
        message: "Failed to update user",
        statusCode: 500,
      },
    }
  }

  return {
    success: true,
    data: mapUserDetail(response.data.user),
  }
}

/**
 * Delete (soft delete) a user
 * DELETE /users/:id
 *
 * Permissions: clinic_admin or system_admin only
 * May fail with 409 USER_HAS_PENDING_RECORDS if user has dependencies
 *
 * @param userId User ID to delete
 * @returns Success response
 */
export async function deleteUser(userId: number): Promise<ApiResponse<{ message: string }>> {
  return request<{ success: true; message: string }>(`/users/${userId}`, "DELETE")
}

/**
 * Export filter types for component consumption
 */
export type { UserFilters }
