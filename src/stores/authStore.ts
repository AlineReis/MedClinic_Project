import { request } from "../services/apiService"
import { uiStore } from "./uiStore"

export type UserRole =
  | "patient"
  | "receptionist"
  | "lab_tech"
  | "health_professional"
  | "clinic_admin"
  | "system_admin"

export interface UserSession {
  id: number
  name: string
  email: string
  role: UserRole
  cpf?: string
  phone?: string
}

interface AuthState {
  session: UserSession | null
  isCheckingAuth: boolean
}

type Subscriber = (state: AuthState) => void

const NETWORK_RETRY_ATTEMPTS = 1

class AuthStore {
  private state: AuthState = { session: null, isCheckingAuth: false }
  private subscribers: Subscriber[] = []
  private refreshPromise: Promise<UserSession | null> | null = null

  getSession() {
    return this.state.session
  }

  isAuthenticated() {
    return Boolean(this.state.session)
  }

  getIsCheckingAuth() {
    return this.state.isCheckingAuth
  }

  subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber)
    subscriber(this.state)
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== subscriber)
    }
  }

  async refreshSession(): Promise<UserSession | null> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.setChecking(true)

    this.refreshPromise = (async () => {
      let attempt = 0

      while (attempt <= NETWORK_RETRY_ATTEMPTS) {
        try {
          const user = await this.fetchProfile()
          if (user) {
            this.setSession(user)
          }
          return user
        } catch (error) {
          attempt += 1

          if (attempt > NETWORK_RETRY_ATTEMPTS) {
            uiStore.addToast(
              "warning",
              "Não foi possível validar sua sessão. Verifique a conexão e tente novamente.",
            )
            return null
          }

          await this.delay(800 * attempt)
        }
      }

      return null
    })()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
      this.setChecking(false)
    }
  }

  setSession(session: UserSession) {
    this.state = { ...this.state, session }
    this.publish()
  }

  clearSession() {
    this.state = { ...this.state, session: null }
    this.publish()
  }

  private setChecking(value: boolean) {
    this.state = { ...this.state, isCheckingAuth: value }
    this.publish()
  }

  private async fetchProfile(): Promise<UserSession | null> {
    const response = await request<{ user: UserSession }>("/auth/profile")

    if (response.success && response.data) {
      return response.data.user
    }

    if (response.error?.statusCode === 401) {
      this.clearSession()
      return null
    }

    if (response.error?.statusCode === 0) {
      throw response.error
    }

    if (response.error) {
      uiStore.addToast("error", response.error.message)
    }

    return null
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private publish() {
    this.subscribers.forEach(subscriber => subscriber(this.state))
  }
}

export const authStore = new AuthStore()
