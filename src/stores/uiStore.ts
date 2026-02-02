// Polyfill for crypto.randomUUID in insecure contexts (HTTP)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  // @ts-ignore
  (crypto as any).randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

type ToastLevel = "info" | "success" | "warning" | "error"

export interface ToastMessage {
  id: string
  level: ToastLevel
  text: string
}

class UiStore {
  private toasts: ToastMessage[] = []
  private subscribers: Array<(toasts: ToastMessage[]) => void> = []

  subscribe(callback: (toasts: ToastMessage[]) => void) {
    this.subscribers.push(callback)
    callback(this.toasts)
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
    }
  }

  private publish() {
    this.subscribers.forEach(callback => callback(this.toasts))
  }

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
    this.publish()
    setTimeout(() => this.removeToast(toast.id), 4500)
    return toast.id
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.publish()
  }
}

export const uiStore = new UiStore()
