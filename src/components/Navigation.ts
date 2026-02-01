import { request } from "../services/apiService";
import { authStore } from "../stores/authStore";
import { uiStore } from "../stores/uiStore";

export class Navigation {
  constructor() {
    this.initLogout();
    this.initUserInitials();
  }

  private initLogout() {
    const logoutBtns = document.querySelectorAll("[data-logout-button], .logout-btn");
    logoutBtns.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!confirm("Tem certeza que deseja sair?")) return;

        try {
          const response = await request("/auth/logout", "POST");
          if (!response.success) {
            uiStore.addToast(
              "error",
              response.error?.message ?? "Erro ao realizar logout",
            );
            return;
          }

          authStore.clearSession();
          window.location.href = "/pages/login.html";
        } catch (error) {
          uiStore.addToast("error", "Erro ao realizar logout");
        }
      });
    });
  }

  private initUserInitials() {
    const userEls = document.querySelectorAll("[data-user-initials]");
    const userNameEls = document.querySelectorAll("[data-user-name]");
    const userRoleEls = document.querySelectorAll("[data-user-role]");

    authStore.subscribe((state) => {
      const session = state.session;
      const name = session?.name?.trim();
      if (!name) return;

      userEls.forEach(el => el.textContent = this.getInitials(name));
      userNameEls.forEach(el => el.textContent = name.split(" ")[0]);
      if (session?.role) {
        userRoleEls.forEach(el => el.textContent = this.formatRole(session.role));
      }
    });
  }

  private formatRole(role: string) {
    const roles: Record<string, string> = {
      patient: "Paciente",
      health_professional: "Profissional de Saúde",
      lab_tech: "Técnico de Laboratório",
      receptionist: "Recepcionista",
      clinic_admin: "Administrador",
      system_admin: "Admin Sistema",
    };
    return roles[role] || role;
  }

  private getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
}
