import type { UserSession } from "types/auth"
import { listAppointments } from "../services/appointmentsService"
import { listPrescriptions } from "../services/prescriptionsService"
import type { AppointmentSummary } from "../types/appointments"
import type { PrescriptionSummary } from "../types/prescriptions"
import { uiStore } from "./uiStore"

export type DashboardEventDetail = {
  appointments: AppointmentSummary[]
  prescriptions: PrescriptionSummary[]
  isLoading: boolean
  hasError: boolean
}

export const DASHBOARD_APPOINTMENTS_EVENT = "dashboard-appointments-ready"

class DashboardStore {
  private appointments: AppointmentSummary[] = []
  private prescriptions: PrescriptionSummary[] = []
  private isLoading = false
  private hasError = false

  async loadAppointmentsForSession(session: UserSession) {
    if (!session) {
      this.publish()
      return
    }

    const patientId = session.role === "patient" ? session.id : undefined
    await this.fetchPatientDashboardData(patientId)
  }

  private async fetchPatientDashboardData(patientId?: number) {
    this.setLoading(true)
    this.setError(false)

    const appointmentFilters = patientId ? { patientId } : {}
    const prescriptionFilters = patientId ? { patientId } : {}

    try {
      const [appointmentsResponse, prescriptionsResponse] = await Promise.all([
        listAppointments(appointmentFilters),
        listPrescriptions(prescriptionFilters),
      ])

      if (appointmentsResponse.success && appointmentsResponse.data) {
        this.setAppointments(appointmentsResponse.data)
      } else {
        uiStore.addToast(
          "warning",
          appointmentsResponse.error?.message ??
            "Não foi possível carregar seus agendamentos.",
        )
        this.setAppointments([])
      }

      if (prescriptionsResponse.success && prescriptionsResponse.data) {
        this.setPrescriptions(prescriptionsResponse.data)
      } else {
        uiStore.addToast(
          "warning",
          prescriptionsResponse.error?.message ??
            "Não foi possível carregar suas prescrições.",
        )
        this.setPrescriptions([])
      }
    } catch (error) {
      this.setError(true)
      uiStore.addToast(
        "error",
        "Ocorreu um erro ao buscar seus dados do dashboard.",
      )
      this.setAppointments([])
      this.setPrescriptions([])
      console.error("dashboardStore error", error)
    } finally {
      this.setLoading(false)
    }
  }

  private setAppointments(appointments: AppointmentSummary[]) {
    this.appointments = appointments
    this.publish()
  }

  private setPrescriptions(prescriptions: PrescriptionSummary[]) {
    this.prescriptions = prescriptions
    this.publish()
  }

  private setLoading(value: boolean) {
    this.isLoading = value
    this.publish()
  }

  private setError(value: boolean) {
    this.hasError = value
    this.publish()
  }

  private publish() {
    const detail: DashboardEventDetail = {
      appointments: this.appointments,
      prescriptions: this.prescriptions,
      isLoading: this.isLoading,
      hasError: this.hasError,
    }

    window.dispatchEvent(
      new CustomEvent<DashboardEventDetail>("dashboard-appointments-ready", {
        detail,
      }),
    )
  }
}

export const dashboardStore = new DashboardStore()
