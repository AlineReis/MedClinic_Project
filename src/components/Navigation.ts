import { request } from "../services/apiService"
import { authStore } from "../stores/authStore"
import { uiStore } from "../stores/uiStore"

export class Navigation {
    constructor() {
        this.initLogout()
        this.initUserInitials()
    }

    private initLogout() {
        const logoutBtn = document.querySelector("[data-logout-button]")
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                if (!confirm("Tem certeza que deseja sair?")) return

                try {
                    await request("/auth/logout", "POST")
                    authStore.clearSession()
                    window.location.href = "/pages/login.html"
                } catch (error) {
                    uiStore.addToast("error", "Erro ao realizar logout")
                }
            })
        }
    }

    private initUserInitials() {
        const userEl = document.querySelector("[data-user-initials]")
        const userNameEl = document.querySelector("[data-user-name]")

        authStore.subscribe(state => {
            const session = state.session
            if (session) {
                if (userEl) userEl.textContent = this.getInitials(session.name)
                if (userNameEl) userNameEl.textContent = session.name.split(" ")[0]
            }
        })
    }

    private getInitials(name: string) {
        return name
            .split(" ")
            .map(n => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
    }
}
