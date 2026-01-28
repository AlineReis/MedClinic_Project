import { uiStore, type ToastMessage } from "../stores/uiStore"

export class ToastContainer {
    private container: HTMLElement

    constructor() {
        this.container = document.createElement("div")
        this.container.className =
            "fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
        document.body.appendChild(this.container)

        uiStore.subscribe(this.render.bind(this))
    }

    private render(toasts: ToastMessage[]) {
        this.container.innerHTML = ""

        toasts.forEach(toast => {
            const toastEl = document.createElement("div")
            toastEl.className = `
        pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-xl shadow-lg border border-border-dark flex items-start gap-3 animate-slide-in
        ${toast.level === "error"
                    ? "bg-red-500/10 border-red-500/20 text-red-200"
                    : toast.level === "success"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                        : toast.level === "warning"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                            : "bg-surface-dark text-slate-200"
                }
      `

            const icon =
                toast.level === "error"
                    ? "error"
                    : toast.level === "success"
                        ? "check_circle"
                        : toast.level === "warning"
                            ? "warning"
                            : "info"

            toastEl.innerHTML = `
        <span class="material-symbols-outlined text-xl shrink-0">${icon}</span>
        <p class="text-sm font-medium leading-tight pt-0.5">${toast.text}</p>
        <button class="ml-auto text-current opacity-70 hover:opacity-100 transition-opacity" onclick="this.closest('div').remove()">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      `

            // Add Click Listener specifically for close button if we want to sync with store
            const closeBtn = toastEl.querySelector("button")
            closeBtn?.addEventListener("click", () => {
                uiStore.removeToast(toast.id)
            })

            this.container.appendChild(toastEl)
        })
    }
}
