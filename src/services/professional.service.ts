import type { IUserRepository } from '@repositories/iuser.repository.js';
import bcrypt from 'bcrypt';
import { Availability, ProfessionalDetails } from '../models/professional.model.js';
import { User } from '../models/user.js';
import { AvailabilityRepository } from '../repository/availability.repository.js';
import { ProfessionalRepository } from '../repository/professional.repository.js';
import * as Validators from '../utils/validators.js';

export class ProfessionalService {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly professionalRepository: ProfessionalRepository,
    private readonly availabilityRepository: AvailabilityRepository
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

  async listBySpecialty(specialty: string) {
    return await this.professionalRepository.findBySpecialty(specialty);
  }
}
