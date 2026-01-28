import "../../css/global.css"
import { Navigation } from "../components/Navigation"
import { ToastContainer } from "../components/ToastContainer"
import { request } from "../services/apiService"
import { authStore } from "../stores/authStore"
import { dashboardStore } from "../stores/dashboardStore"
import { uiStore } from "../stores/uiStore"

// Initialize Components
new ToastContainer()
new Navigation()

// Auth Check & Data Loading
const authReadyPromise = authStore.refreshSession() // Use single source of truth from authStore if possible, or just wait.
// In src/index.ts we set window.authReadyPromise. We should probably reuse that if we were in the same bundle,
// but we are a separate entry point. So we check auth again.

// However, authStore is a singleton, but since this is a separate page/bundle, 
// the state isn't shared in memory across pages unless we used a shared worker or Service Worker.
// Since we are SPA-like but with MPA pages, we need to re-verify auth on each page load.

async function init() {
    const session = await authStore.refreshSession()

    if (!session) {
        window.location.href = "/pages/login.html"
        return
    }

    if (session.role !== "patient") {
        // Basic role protection
        uiStore.addToast("warning", "Acesso restrito a pacientes.")
        setTimeout(() => {
            window.location.href = "/" // Go home or login
        }, 2000)
        return
    }

    // Load Dashboard Data
    dashboardStore.loadAppointmentsForSession(session)

    // Setup other listeners if needed
    setupEventListeners()
}

function setupEventListeners() {
    window.addEventListener("dashboard-appointments-ready", ((e: CustomEvent) => {
        const { appointments, isLoading } = e.detail
        renderAppointments(appointments, isLoading)
    }) as EventListener)
}

function renderAppointments(appointments: any[], isLoading: boolean) {
    // This is where we would toggle loading states and render the list
    // For now, let's just log or set a simple text effectively replacing the HTML placeholders
    // Ideally we would map the 'appointments' to the DOM elements in 'pages/patient-dashboard.html'

    // Example: Update "Next Appointment" section
    const nextApptContainer = document.querySelector(".lg\\:col-span-2")
    if (nextApptContainer) {
        if (isLoading) {
            nextApptContainer.classList.add("opacity-50")
        } else {
            nextApptContainer.classList.remove("opacity-50")
            // TODO: actually render the next appointment here
            if (appointments.length === 0) {
                nextApptContainer.innerHTML = `
                <div class="bg-surface-dark border border-border-dark rounded-2xl p-6 text-center text-slate-400">
                    <p>Você não tem consultas agendadas.</p>
                </div>`
            }
        }
    }
}

init()
