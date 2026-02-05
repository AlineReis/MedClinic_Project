import "../css/global.css";

import { roleRoutes } from "./config/roleRoutes";
import "./pages/login";
import "./services/apiService";
import { authStore } from "./stores/authStore";
import { dashboardStore } from "./stores/dashboardStore";
import "./stores/uiStore";

const authBlocker = createAuthBlocker();

authStore.subscribe((state) => {
  if (state.isCheckingAuth) {
    authBlocker.classList.remove("auth-blocker--hidden");
  } else {
    authBlocker.classList.add("auth-blocker--hidden");
  }
});

const authReadyPromise = authStore.refreshSession();
(window as Window & { authReadyPromise?: Promise<unknown> }).authReadyPromise =
  authReadyPromise;

authReadyPromise.then((session) => {
  console.log("[auth] session resolved", session);
  const currentPath = window.location.pathname || "";
  const isRoot = currentPath.endsWith("/index.html") || currentPath === "/";
  const loginPath = "/server03/pages/login.html";
  const allowWhileAuthenticated = new Set([
    "/server03/pages/schedule-appointment.html",
    "/server03/pages/my-appointments.html",
    "/server03/pages/exams.html",
    "/server03/pages/financial.html",
    "/server03/pages/users.html",
    "/server03/pages/admin-users.html",
    "/server03/pages/patients.html",
  ])
  if (session) {
    const basePath = window.location.pathname.startsWith('/server03') ? '/server03' : '';

    const rawTarget = roleRoutes[session.role] ?? "/";

    let finalTarget = rawTarget;
    if (basePath && !finalTarget.startsWith(basePath)) {
      finalTarget = basePath + finalTarget;
    }


    const isAtLogin = currentPath.endsWith(loginPath) || currentPath.endsWith('login.html');
    const isAtRoot = isRoot || currentPath === basePath + "/" || currentPath === basePath;

    if (isAtRoot || isAtLogin) {
      console.log("[auth] Redirecionando da raiz/login para:", finalTarget);
      window.location.href = finalTarget;
      return;
    }

    const alreadyAtTarget = currentPath.includes(finalTarget);

    if (!alreadyAtTarget) {
      const normalizedPath = currentPath.replace(basePath, "");

      const isAllowed = allowWhileAuthenticated.has(normalizedPath) ||
        allowWhileAuthenticated.has(currentPath);

      if (!isAllowed) {
        console.log("[auth] Rota n  o permitida. Redirecionando para:", finalTarget);
        window.location.href = finalTarget;
        return;
      }
    }

    const shouldLoadAppointments = [
      "patient",
      "receptionist",
      "health_professional",
    ].includes(session.role);

    if (shouldLoadAppointments) {
      console.log("[dashboard] loading appointments for session", session);
      dashboardStore.loadAppointmentsForSession(session);
    }

  } else if (!currentPath.endsWith(loginPath)) {
    const basePath = window.location.pathname.startsWith('/server03') ? '/server03' : '';
    let finalLoginPath = loginPath;

    if (basePath && !finalLoginPath.startsWith(basePath)) {
      finalLoginPath = basePath + finalLoginPath;
    }

    window.location.href = finalLoginPath;
    return;
  }

  window.dispatchEvent(
    new CustomEvent("auth-ready", {
      detail: { session },
    }),
  );
});

function createAuthBlocker() {
  const blocker = document.createElement("div");
  blocker.id = "auth-blocker";
  blocker.className = "auth-blocker auth-blocker--hidden";
  blocker.innerHTML = `
    <div class="auth-blocker__content">
      <div class="auth-blocker__spinner" aria-hidden="true"></div>
      <p class="auth-blocker__text">Validando sessão...</p>
    </div>
  `;

  if (document.body) {
    document.body.appendChild(blocker);
  } else {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        document.body.appendChild(blocker);
      },
      { once: true },
    );
  }

  return blocker;
}
