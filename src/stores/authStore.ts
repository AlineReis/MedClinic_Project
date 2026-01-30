import { onUnauthorized } from "../services/apiService"
import { profile } from "../services/authService"
import type { UserSession } from "../types/auth"
import { uiStore } from "./uiStore"

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

  constructor() {
    onUnauthorized(() => this.handleUnauthorized())
  }

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
    const response = await profile()

    const payloadUser =
      response.data?.user ??
      (response as typeof response & { user?: UserSession }).user

    if (response.success && payloadUser) {
      return payloadUser
    }

    if (response.error?.statusCode === 401) {
      this.handleUnauthorized()
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

  private handleUnauthorized() {
    this.clearSession()
    uiStore.addToast("warning", "Sua sessão expirou. Faça login novamente.")
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private publish() {
    this.subscribers.forEach(subscriber => subscriber(this.state))
  }
}

export const authStore = new AuthStore()
