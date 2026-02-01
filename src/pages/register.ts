import "../../css/pages/auth.css"
import "../../css/global.css"
import { ToastContainer } from "../components/ToastContainer"
import { request } from "../services/apiService"
import { uiStore } from "../stores/uiStore"

new ToastContainer()

const registerForm = document.getElementById("register-form") as HTMLFormElement
const cpfInput = document.getElementById("cpf") as HTMLInputElement
const phoneInput = document.getElementById("phone") as HTMLInputElement

if (cpfInput) {
    cpfInput.addEventListener("input", e => {
        let v = (e.target as HTMLInputElement).value.replace(/\D/g, "")
        v = v.replace(/(\d{3})(\d)/, "$1.$2")
        v = v.replace(/(\d{3})(\d)/, "$1.$2")
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2")
            ; (e.target as HTMLInputElement).value = v
    })
}

if (phoneInput) {
    phoneInput.addEventListener("input", e => {
        let v = (e.target as HTMLInputElement).value.replace(/\D/g, "")
        v = v.replace(/^(\d{2})(\d)/, "($1) $2")
        v = v.replace(/(\d{5})(\d)/, "$1-$2")
            ; (e.target as HTMLInputElement).value = v
    })
}

if (registerForm) {
    registerForm.addEventListener("submit", async e => {
        e.preventDefault()

        const name = (document.getElementById("name") as HTMLInputElement).value
        const cpf = (document.getElementById("cpf") as HTMLInputElement).value
        const email = (document.getElementById("email") as HTMLInputElement).value
        const phone = (document.getElementById("phone") as HTMLInputElement).value
        const password = (document.getElementById("password") as HTMLInputElement).value
        const confirmPassword = (document.getElementById("confirm-password") as HTMLInputElement).value
        const terms = (document.getElementById("terms") as HTMLInputElement).checked

        if (!terms) {
            uiStore.addToast("warning", "Você precisa aceitar os termos de uso.")
            return
        }

        if (password !== confirmPassword) {
            uiStore.addToast("warning", "As senhas não coincidem.")
            return
        }

        try {
            const response = await request("/auth/register", "POST", {
                name,
                cpf, // clean masks
                email,
                phone,
                password,
                role: "patient", // default role for public registration
            })

            if (response.success) {
                uiStore.addToast("success", "Conta criada com sucesso!")
                // Auto-login or redirect
                setTimeout(() => {
                    // Optionally auto-login if the API returns a session,
                    // but usually we redirect to login or onboarding
                    window.location.href = "onboarding.html"
                }, 1500)
            } else {
                // Error is handled by apiService usually but usually shows toast
                // If we want specific field errors handled manually:
                if (response.error) {
                    // already toasted by apiService?
                    // Wait, apiService only returns error object, doesn't auto-toast properly unless we configured it?
                    // Looking at apiService.ts provided earlier:
                    // it returns { success: false, error: ... }
                    // The caller usually handles it, OR fetchProfile handled it.
                    // request() does NOT auto-toast errors generally.
                    uiStore.addToast("error", response.error.message)
                }
            }
        } catch (error) {
            uiStore.addToast("error", "Erro ao tentar registrar.")
            console.error(error)
        }
    })
}
