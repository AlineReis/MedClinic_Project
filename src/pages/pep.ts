import "../../css/global.css";
import { Navigation } from "../components/Navigation";
import { ToastContainer } from "../components/ToastContainer";
import { authStore } from "../stores/authStore";

document.addEventListener("DOMContentLoaded", () => {
    new ToastContainer();
    new Navigation();
    hydrateSessionUser();
});

function hydrateSessionUser() {
    const session = authStore.getSession();
    if (!session) return;

    document.querySelectorAll("[data-user-name]").forEach(element => {
        element.textContent = session.name || "Usuário";
    });

    document.querySelectorAll("[data-user-initials]").forEach(element => {
        element.textContent = getInitials(session.name || "U");
    });
}

function getInitials(name: string) {
    if (!name) return "U";

    return name
        .split(" ")
        .filter(Boolean)
        .map(part => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
