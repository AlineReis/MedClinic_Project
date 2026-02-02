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
  const loginPath = "/pages/login.html";
  const allowWhileAuthenticated = new Set([
    "/pages/schedule-appointment.html",
    "/pages/my-appointments.html",
    "/pages/exams.html",
  ]);
  if (session) {
    const target = roleRoutes[session.role] ?? "/";
    console.log("[auth] role target", target, "current", currentPath);
    if (isRoot || currentPath === loginPath) {
      window.location.href = target;
      return;
    }
    if (currentPath !== target && !allowWhileAuthenticated.has(currentPath)) {
      window.location.href = target;
      return;
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
    console.log("[auth] no session, redirecting to login");
    window.location.href = loginPath;
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
