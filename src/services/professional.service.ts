import { UserRepository } from '../repository/user.repository.js';
import { ProfessionalRepository } from '../repository/professional.repository.js';
import { AvailabilityRepository } from '../repository/availability.repository.js';
import { UserService } from './user.service.js'; 
import { User } from '../models/user.js';
import { ProfessionalDetails, Availability } from '../models/professional.model.js';
import * as Validators from '../utils/validators.js';
import bcrypt from 'bcrypt';

const userRepo = new UserRepository();
const profRepo = new ProfessionalRepository();
const availRepo = new AvailabilityRepository();

export class ProfessionalService {
  
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

    const existing = await userRepo.findByEmail(userData.email);
    if (existing) throw new Error('Email already in use');

    const defaultPassword = process.env.DEFAULT_PROFESSIONAL_PASSWORD || 'Mudar123';
    const hashedPassword = await bcrypt.hash(userData.password || defaultPassword, 10);

    let userId: number | null = null;

    try {
      userId = await userRepo.createHealthProfessional({
        ...userData,
        password: hashedPassword
      });

      await profRepo.create({
        ...detailsData,
        user_id: userId
      });

      for (const slot of availabilities) {
        await availRepo.create({
          ...slot,
          professional_id: userId
        });
      }

      return { userId, message: 'Professional registered successfully' };

    } catch (error) {
       console.error('Registration failed, rolling back...', error);
       if (userId) {
         await userRepo.delete(userId);
       }
       throw error;
    }
  }

  async listBySpecialty(specialty: string) {
    return await profRepo.findBySpecialty(specialty);
  }
}
