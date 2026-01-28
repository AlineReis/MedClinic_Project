export type Specialty = 
  | 'psicologia'
  | 'nutricao'
  | 'fonoaudiologia'
  | 'fisioterapia'
  | 'clinica_medica'
  | 'cardiologia'
  | 'oftalmologia'
  | 'urologia'
  | 'cirurgia_geral'
  | 'ortopedia'
  | 'neurologia';

export interface ProfessionalDetails {
  id?: number;
  user_id: number;
  specialty: Specialty;
  registration_number: string;
  council?: string;
  consultation_price: number;
  commission_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Availability {
  id?: number;
  professional_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: number;
  created_at?: string;
}
