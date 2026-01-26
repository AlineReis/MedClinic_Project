import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repository/user.repository.js';
import { User } from '../models/user.js';
import * as Validators from '../utils/validators.js';

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async registerPatient(userData: User): Promise<{ user: User; token: string }> {
    if (!Validators.isValidEmail(userData.email)) throw new Error('Invalid email format');
    if (userData.password && !Validators.isValidPassword(userData.password)) {
      throw new Error('Password must have 8+ chars, uppercase, lowercase and number');
    }
    if (userData.cpf && !Validators.isValidCpfLogic(userData.cpf)) throw new Error('Invalid CPF');

    const existingUser = await this.userRepo.findByEmail(userData.email);
    if (existingUser) throw new Error('Email already in use');

    if (!userData.password) throw new Error('Password is required');
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUserId = await this.userRepo.createPatient({
      ...userData,
      password: hashedPassword
    });

    const user = await this.userRepo.findById(newUserId);
    if (!user) throw new Error('Error retrieving created user');
    
    const { password, ...userWithoutPassword } = user;
    const token = this.generateToken(user);

    return { user: userWithoutPassword as User, token };
  }

  async login(email: string, passwordRaw: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');
    if (!user.password) throw new Error('Invalid email or password');

    const isMatch = await bcrypt.compare(passwordRaw, user.password);
    if (!isMatch) throw new Error('Invalid email or password');

    const token = this.generateToken(user);
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword as User, token };
  }

  private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || 'default_secret_dev_only';
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '24h' }
    );
  }
}
