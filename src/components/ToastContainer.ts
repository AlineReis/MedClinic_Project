import { uiStore, type ToastMessage } from "../stores/uiStore"

export class ToastContainer {
    private container: HTMLElement

    constructor() {
        this.container = document.createElement("div")
        this.container.className = "toast-container"
        document.body.appendChild(this.container)

        uiStore.subscribe(this.render.bind(this))
    }

    private render(toasts: ToastMessage[]) {
        this.container.innerHTML = ""

        toasts.forEach(toast => {
            const toastEl = document.createElement("div")
            toastEl.className = `toast-item toast-item-${toast.level || "info"} u-flex u-items-start u-gap-medium`

            const icon =
                toast.level === "error"
                    ? "error"
                    : toast.level === "success"
                        ? "check_circle"
                        : toast.level === "warning"
                            ? "warning"
                            : "info"

            toastEl.innerHTML = `
        <span class="material-symbols-outlined u-text-inherit u-fs-lg">${icon}</span>
        <div class="u-flex-column u-gap-xs">
          <p class="u-fs-sm u-fw-600">${toast.text}</p>
        </div>
        <button class="u-ml-auto u-opacity-70 hover:u-opacity-100" aria-label="Fechar">
          <span class="material-symbols-outlined u-fs-md">close</span>
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
