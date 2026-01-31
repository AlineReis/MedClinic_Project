export interface AppointmentSummary {
  id: number;
  patient_id: number;
  patient_name: string;
  professional_id: number;
  professional_name: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
  price?: number;
  room?: string | null;
  duration_minutes?: number;
  professional_image?: string;
}
