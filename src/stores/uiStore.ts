type ToastLevel = "info" | "success" | "warning" | "error"

export interface ToastMessage {
  id: string
  level: ToastLevel
  text: string
}

class UiStore {
  private toasts: ToastMessage[] = []

  getToasts() {
    return this.toasts
  }

  addToast(level: ToastLevel, text: string) {
    const toast: ToastMessage = {
      id: crypto.randomUUID(),
      level,
      text,
    }
    this.toasts = [...this.toasts, toast]
    setTimeout(() => this.removeToast(toast.id), 4500)
    return toast.id
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
  }
}

export const uiStore = new UiStore()
