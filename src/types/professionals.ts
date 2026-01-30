export type ProfessionalSummary = {
  id: number
  name: string
  specialty: string
  consultation_price?: number
  registration_number?: string
  council?: string
}

export type ProfessionalAvailabilitySlot = {
  time: string
  is_available: boolean
  duration_minutes: number
  reason?: string
}

export type ProfessionalAvailabilityEntry = {
  date: string
  time: string
  is_available: boolean
  reason?: string
}

export type ProfessionalAvailabilityDay = {
  date: string
  dayOfWeek: string
  slots: ProfessionalAvailabilitySlot[]
}

export type ProfessionalAvailabilityResponse = {
  professional: {
    id: number
    name: string
    specialty?: string
    consultation_price?: number
  }
  data: ProfessionalAvailabilityDay[]
}

export type CommissionDetail = {
  id: number
  appointment_id: number
  amount: number
  status: "pending" | "paid"
  created_at: string
  paid_at?: string
}

export type CommissionSummary = {
  month?: number
  year?: number
  pending: number
  paid: number
  total: number
}

export type CommissionsResponse = {
  professional: {
    id: number
    name: string
  }
  summary: CommissionSummary
  details: CommissionDetail[]
}

export type AvailabilityInput = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export type AvailabilityRecord = {
  id: number
  professional_id: number
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export type CreateAvailabilityRequest = {
  availabilities: AvailabilityInput[]
}

export type CreateAvailabilityResponse = {
  data: AvailabilityRecord[]
  message: string
}
