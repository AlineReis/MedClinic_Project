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
