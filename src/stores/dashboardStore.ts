import type { UserSession } from "types/auth"
import { listAppointments } from "../services/appointmentsService"
import { uiStore } from "./uiStore"

import type { AppointmentSummary } from "../types/appointments"

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
      const response = await listAppointments(parseQuery(query))
      console.log(response)

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

  private setAppointments(appointments: any /*AppointmentSummary[]*/) {
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

function parseQuery(query: string) {
  if (!query) return {}
  const params = new URLSearchParams(query.replace(/^\?/, ""))
  const upcoming = params.get("upcoming")

  return {
    patientId: toNumber(params.get("patient_id")),
    professionalId: toNumber(params.get("professional_id")),
    status: params.get("status") ?? undefined,
    date: params.get("date") ?? undefined,
    upcoming: upcoming === null ? undefined : upcoming === "true",
  }
}

function toNumber(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

export const dashboardStore = new DashboardStore()
