import { roleRoutes } from "../config/roleRoutes"
import { handleError } from "../services/apiService"
import { login as authLogin } from "../services/authService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"
import type { UserRole, UserSession } from "../types/auth"

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
