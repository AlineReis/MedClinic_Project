import "../../css/global.css"
import "../../css/pages/auth.css"
import { Navigation } from "../components/Navigation"
import { ToastContainer } from "../components/ToastContainer"
import { request } from "../services/apiService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"

new ToastContainer()

const registerForm = document.getElementById("register-form") as HTMLFormElement
const cpfInput = document.getElementById("cpf") as HTMLInputElement
const phoneInput = document.getElementById("phone") as HTMLInputElement
const generateBtn = document.getElementById("generate-password-btn") as HTMLButtonElement | null
const generatedPasswordInput = document.getElementById("generated-password") as HTMLInputElement | null
const copyBtn = document.getElementById("copy-password-btn") as HTMLButtonElement | null

let toastContainer: ToastContainer | null = null;
let navigation: Navigation | null = null;

async function initRegisterPage() {
    toastContainer = new ToastContainer();
    navigation = new Navigation();
    const session = await authStore.refreshSession();

    if (
        !session ||
        (session.role !== "receptionist" &&
            session.role !== "clinic_admin" &&
            session.role !== "system_admin")
    ) {
        uiStore.addToast("error", "Acesso negado.")
        window.location.href = "/pages/login.html";
        return;
    }
}

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
        v = v.slice(0, 11)
        if (v.length >= 2) {
            const ddd = v.slice(0, 2)
            const rest = v.slice(2)
            if (rest.length > 5) {
                v = `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`
            } else if (rest.length > 4) {
                v = `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`
            } else {
                v = `(${ddd}) ${rest}`
            }
        }
        ; (e.target as HTMLInputElement).value = v
    })
}

if (generateBtn) {
    generateBtn.addEventListener("click", () => {
        console.log("clicked")
        const pwd = generateStrongPassword()
        if (generatedPasswordInput) generatedPasswordInput.value = pwd
    })
}

if (copyBtn) {
    copyBtn.addEventListener("click", () => {
        if (generatedPasswordInput && generatedPasswordInput.value) {
            navigator.clipboard.writeText(generatedPasswordInput.value)
            uiStore.addToast("success", "Senha copiada!")
        }
    })
}

if (registerForm) {
    registerForm.addEventListener("submit", async e => {
        e.preventDefault()

        const name = (document.getElementById("name") as HTMLInputElement).value
        const cpf = (document.getElementById("cpf") as HTMLInputElement).value
        const email = (document.getElementById("email") as HTMLInputElement).value
        const phone = (document.getElementById("phone") as HTMLInputElement).value
        const password = generatedPasswordInput?.value || ""

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

function generateStrongPassword(): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRegisterPage);
} else {
    initRegisterPage();
}
