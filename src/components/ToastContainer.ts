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
            toastEl.className = `toast-item toast-item--${toast.level || "info"}`

            const icon =
                toast.level === "error"
                    ? "error"
                    : toast.level === "success"
                        ? "check_circle"
                        : toast.level === "warning"
                            ? "warning"
                            : "info"

            toastEl.innerHTML = `
        <span class="material-symbols-outlined toast-item__icon">${icon}</span>
        <div class="toast-item__content">
          <p class="toast-item__text">${toast.text}</p>
        </div>
        <button class="toast-item__close" aria-label="Fechar">
          <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
        </button>
      `

            const closeBtn = toastEl.querySelector("button")
            closeBtn?.addEventListener("click", () => {
                uiStore.removeToast(toast.id)
            })

            this.container.appendChild(toastEl)
        })
    }
}
