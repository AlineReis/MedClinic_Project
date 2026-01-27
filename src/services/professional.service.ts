import type { IUserRepository } from '@repositories/iuser.repository.js';
import bcrypt from 'bcrypt';
import { Availability, ProfessionalDetails } from '../models/professional.model.js';
import { User } from '../models/user.js';
import { AvailabilityRepository } from '../repository/availability.repository.js';
import { ProfessionalRepository } from '../repository/professional.repository.js';
import { AppointmentRepository } from '../repository/appointment.repository.js'; // Reverted to relative
import * as Validators from '../utils/validators.js';

const SLOT_DURATION_MINUTES = 50;

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper para somar minutos no formato HH:MM
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export class ProfessionalService {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly professionalRepository: ProfessionalRepository,
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly appointmentRepository: AppointmentRepository 
  ){}

  async register(
    userData: User,
    detailsData: ProfessionalDetails,
    availabilities: Availability[] = []
  ): Promise<any> {

    if (userData.cpf && !Validators.isValidCpfLogic(userData.cpf)) {
      throw new Error('Invalid CPF');
    }
    if (!detailsData.registration_number) {
       throw new Error('Registration number (CRM/CRP) is required');
    }

    const existing = await this.usersRepository.findByEmail(userData.email);
    if (existing) throw new Error('Email already in use');

    const defaultPassword = process.env.DEFAULT_PROFESSIONAL_PASSWORD || 'Mudar123';
    const hashedPassword = await bcrypt.hash(userData.password || defaultPassword, 10);

    let userId: number | null = null;

    try {
      userId = await this.usersRepository.createHealthProfessional({
        ...userData,
        password: hashedPassword
      });

      await this.professionalRepository.create({
        ...detailsData,
        user_id: userId
      });

      for (const slot of availabilities) {
        await this.availabilityRepository.create({
          ...slot,
          professional_id: userId
        });
      }

      return { userId, message: 'Professional registered successfully' };

    } catch (error) {
       console.error('Registration failed, rolling back...', error);
       if (userId) {
         await this.usersRepository.delete(userId);
       }
       throw error;
    }
  }

  async getAvailability(professionalId: number, daysAhead: number = 7) {
    // 1. Buscar a agenda base do profissional (ex: Segunda 08-12)
    const schedule = await this.availabilityRepository.findByProfessionalId(professionalId);
    
    if (!schedule || schedule.length === 0) {
      return [];
    }

    const availableSlots: { date: string; time: string; is_available: boolean }[] = [];
    const today = new Date();

    //Iterar pelos próximos N dias
    for (let i = 0; i < daysAhead; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      const dayOfWeek = currentDate.getDay(); // 0=Dom, 1=Seg...
      const dateStr = formatDate(currentDate);

      // 3. Encontrar regras para este dia da semana
      const dailyRules = schedule.filter(s => s.day_of_week === dayOfWeek);

      for (const rule of dailyRules) {
        let currentTime = rule.start_time;
        const endTime = rule.end_time;

        // 4. Gerar slots de 50 minutos
        while (currentTime < endTime) {
           const slotEnd = addMinutes(currentTime, SLOT_DURATION_MINUTES);
           
           if (slotEnd > endTime) break;

           availableSlots.push({
             date: dateStr,
             time: currentTime,
             is_available: true // livre por padrão
           });

           currentTime = slotEnd; 
        }
      }
    }

    // Busca agendamentos desse profissional no range de datas
    const startDate = formatDate(today);
    const endDateDate = new Date(today);
    endDateDate.setDate(today.getDate() + daysAhead);
    const endDate = formatDate(endDateDate);

    const appointments = await this.appointmentRepository.findAll(
      { professional_id: professionalId, startDate, endDate },
      { page: 1, pageSize: 1000 }
    );

    // 6. Marcar slots ocupados
    for (const slot of availableSlots) {
       const isTaken = appointments.data.some(appt => 
          appt.date === slot.date && 
          appt.time === slot.time &&
          appt.status !== 'cancelled_by_patient' && 
          appt.status !== 'cancelled_by_clinic'
       );
       
       if (isTaken) {
         slot.is_available = false;
       }
    }

    return availableSlots.filter(s => s.is_available); // Retorna só os livres (Card 4.3.3 pede is_available, mas geralmente frontend quer só os livres. Vou retornar estrutura completa se precisar)
  }

  async createAvailability(professionalId: number, slot: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }): Promise<Availability> {
      if (slot.start_time >= slot.end_time) {
          throw new Error('Start time must be before end time');
      }

      const allRules = await this.availabilityRepository.findByProfessionalId(professionalId);
      const dayRules = allRules.filter(r => r.day_of_week === slot.day_of_week);

      for (const rule of dayRules) {
          if (slot.start_time < rule.end_time && slot.end_time > rule.start_time) {
              throw new Error(`Time overlap with existing rule: ${rule.start_time} - ${rule.end_time}`);
          }
      }

      const id = await this.availabilityRepository.create({
          ...slot,
          professional_id: professionalId
      });
      
      return {
          id,
          professional_id: professionalId,
          ...slot,
          is_active: 1
      };
  }

  async listProfessionals(filters: { specialty?: string; name?: string }, page: number = 1, pageSize: number = 10) {
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    
    return await this.professionalRepository.list(filters, limit, offset);
  }
}
