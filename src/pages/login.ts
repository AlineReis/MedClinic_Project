import "../../css/pages/auth.css"
import { roleRoutes } from "../config/roleRoutes"
import { initTheme } from "../config/theme"
import { handleError } from "../services/apiService"
import { login as authLogin } from "../services/authService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { UserRole, UserSession } from "../types/auth"

const roleCredentials: Record<UserRole, { email: string; password: string }> = {
  patient: { email: "maria@email.com", password: "password" },
  receptionist: { email: "paula@clinica.com", password: "password" },
  lab_tech: { email: "roberto@clinica.com", password: "password" },
  health_professional: {
    email: "carlos@clinica.com",
    password: "password",
  },
  clinic_admin: { email: "admin@clinica.com", password: "password" },
  system_admin: { email: "sysadmin@medclinic.com", password: "password" },
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

initTheme();

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

    if (!email || !password) {
      uiStore.addToast("warning", "Preencha email e senha para continuar.")
      renderToasts()
      return
    }

    try {
      const response = await authLogin({ email, password, role })
      const loginUser =
        response.data?.user ??
        (response as typeof response & { user?: UserSession }).user

      if (!loginUser) {
        uiStore.addToast(
          "error",
          response.error?.message ?? "Não foi possível fazer login.",
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
    toastElement.className = `toast-item toast-item-${toast.level || 'info'}`
    toastElement.textContent = toast.text
    toastContainer.appendChild(toastElement)
  })
}
