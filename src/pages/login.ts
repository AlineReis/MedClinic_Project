import { roleRoutes } from "../config/roleRoutes"
import { ApiResponse, handleError, request } from "../services/apiService"
import { authStore, UserRole, UserSession } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"

interface LoginResponsePayload {
  user: UserSession
}

type LoginResponseEnvelope = ApiResponse<LoginResponsePayload> & {
  user?: UserSession
}

const roleCredentials: Record<UserRole, { email: string; password: string }> = {
  patient: { email: "paciente@medclinic.com", password: "Paciente@123" },
  receptionist: { email: "recepcao@medclinic.com", password: "Recepcao@123" },
  lab_tech: { email: "labs@medclinic.com", password: "Laboratorio@123" },
  health_professional: {
    email: "profissional@medclinic.com",
    password: "Profissional@123",
  },
  clinic_admin: { email: "gestor@medclinic.com", password: "Gestor@123" },
  system_admin: { email: "sistema@medclinic.com", password: "Admin@123" },
}

const loginForm = document.getElementById(
  "login-form",
) as HTMLFormElement | null
const toastContainer = document.getElementById("toast-container")
const emailInput = document.getElementById("email") as HTMLInputElement | null
const passwordInput = document.getElementById(
  "password",
) as HTMLInputElement | null
const roleSelect = document.getElementById("role") as HTMLSelectElement | null

console.log("login.ts bundle loaded")

if (loginForm && emailInput && passwordInput && roleSelect) {
  roleSelect.addEventListener("change", () => {
    applyRoleCredentials(roleSelect.value as UserRole)
  })

  applyRoleCredentials(roleSelect.value as UserRole)

  loginForm.addEventListener("submit", async event => {
    event.preventDefault()

    const email = emailInput.value.trim()
    const password = passwordInput.value.trim()
    const role = roleSelect.value as UserRole

    console.log("Submitting login", { email, role })

    if (!email || !password) {
      uiStore.addToast("warning", "Preencha email e senha para continuar.")
      renderToasts()
      return
    }

    try {
      const response = await request<LoginResponsePayload>(
        "/auth/login",
        "POST",
        {
          email,
          password,
          role,
        },
      )

      const normalizedResponse = response as LoginResponseEnvelope
      const loginUser =
        normalizedResponse.user ?? extractLoginUser(normalizedResponse)

      console.log("login response", response)

      if (!loginUser) {
        uiStore.addToast(
          "error",
          response.error?.message || "Não foi possível fazer login.",
        )
        renderToasts()
        return
      }

      const validatedSession = await handleSuccessfulLogin(loginUser)

      if (!validatedSession) return

      window.location.href = roleRoutes[validatedSession.role] || "index.html"
    } catch (error) {
      const fallback = handleError(error)
      uiStore.addToast(
        "error",
        fallback.error?.message ?? "Não foi possível conectar ao servidor",
      )
      renderToasts()
    }
  })
}

function applyRoleCredentials(role: UserRole) {
  if (!emailInput || !passwordInput) return

  const credentials = roleCredentials[role]
  if (!credentials) return

  emailInput.value = credentials.email
  passwordInput.value = credentials.password
}

async function handleSuccessfulLogin(
  user: UserSession,
): Promise<UserSession | null> {
  authStore.setSession(user)
  const validatedSession = await authStore.refreshSession()

  if (!validatedSession) {
    authStore.clearSession()
    uiStore.addToast(
      "error",
      "Não foi possível validar o token JWT recebido. Por favor, tente novamente.",
    )
    renderToasts()
    return null
  }

  persistSession(validatedSession)
  return validatedSession
}

function persistSession(session: UserSession) {
  try {
    sessionStorage.setItem("medclinic-session", JSON.stringify(session))
  } catch (error) {
    console.warn("Não foi possível gravar a sessão localmente.", error)
  }
}

function renderToasts() {
  if (!toastContainer) return
  toastContainer.innerHTML = ""

  uiStore.getToasts().forEach(toast => {
    const toastElement = document.createElement("div")
    toastElement.className =
      "rounded-lg px-4 py-2 text-sm shadow-lg border border-border-dark bg-surface-dark"
    toastElement.textContent = toast.text
    toastContainer.appendChild(toastElement)
  })
}

function extractLoginUser(response: LoginResponseEnvelope): UserSession | null {
  if (response.user) {
    return response.user
  }

  if (response.success && response.data?.user) {
    return response.data.user
  }

  return null
}
