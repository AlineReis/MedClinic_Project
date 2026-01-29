import { LoginPayload, RegisterPayload, UserSession } from "../types/auth"
import { request } from "./apiService"

interface AuthResponse {
  user: UserSession
  message?: string
}

export function login(payload: LoginPayload) {
  return request<AuthResponse>("/auth/login", "POST", payload)
}

export function register(payload: RegisterPayload) {
  return request<AuthResponse>("/auth/register", "POST", payload)
}

export function profile() {
  return request<AuthResponse>("/auth/profile", "GET")
}

export function logout() {
  return request<AuthResponse>("/auth/logout", "POST")
}
