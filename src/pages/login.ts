import { roleRoutes } from "../config/roleRoutes"
import { handleError, request } from "../services/apiService"
import { authStore, UserRole } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"

interface LoginResponse {
  user: {
    id: number
    name: string
    email: string
    role: UserRole
  }
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
      const response = await request<LoginResponse>("/auth/login", "POST", {
        email,
        password,
        role,
      })

      if (!response.success || !response.data) {
        uiStore.addToast(
          "error",
          response.error?.message || "Não foi possível fazer login.",
        )
        renderToasts()
        return
      }

      authStore.setSession(response.data.user)
      window.location.href = roleRoutes[response.data.user.role] || "index.html"
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
