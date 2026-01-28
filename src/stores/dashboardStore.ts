import { request } from "../services/apiService"
import type { UserSession } from "./authStore"
import { uiStore } from "./uiStore"

export interface AppointmentSummary {
  id: number
  patient_id: number
  patient_name: string
  professional_id: number
  professional_name: string
  specialty: string
  date: string
  time: string
  status: string
  price?: number
  room?: string | null
}

export type DashboardEventDetail = {
  appointments: AppointmentSummary[]
  isLoading: boolean
}

export const DASHBOARD_APPOINTMENTS_EVENT = "dashboard-appointments-ready"

class DashboardStore {
  private appointments: AppointmentSummary[] = []
  private isLoading = false

  async loadAppointmentsForSession(session: UserSession) {
    if (!session) {
      this.publish()
      return
    }

    const patientQuery =
      session.role === "patient" ? `?patient_id=${session.id}` : ""
    await this.fetchAppointments(patientQuery)
  }

  private async fetchAppointments(query: string) {
    this.setLoading(true)

    try {
      const response = await request<AppointmentSummary[]>(
        `/appointments${query}`,
      )

      if (response.success && response.data) {
        this.setAppointments(response.data)
      } else {
        uiStore.addToast(
          "warning",
          response.error?.message ??
            "Não foi possível carregar seus agendamentos.",
        )
        this.setAppointments([])
      }
    } catch (error) {
      uiStore.addToast("error", "Ocorreu um erro ao buscar seus agendamentos.")
      this.setAppointments([])
      console.error("dashboardStore error", error)
    } finally {
      this.setLoading(false)
    }
  }

  private setAppointments(appointments: AppointmentSummary[]) {
    this.appointments = appointments
    this.publish()
  }

  private setLoading(value: boolean) {
    this.isLoading = value
    this.publish()
  }

  private publish() {
    const detail: DashboardEventDetail = {
      appointments: this.appointments,
      isLoading: this.isLoading,
    }

    window.dispatchEvent(
      new CustomEvent<DashboardEventDetail>("dashboard-appointments-ready", {
        detail,
      }),
    )
  }
}

export const dashboardStore = new DashboardStore()
