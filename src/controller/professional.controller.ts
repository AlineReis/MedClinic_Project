import { Request, Response } from 'express';
import { ProfessionalService } from '../services/professional.service.js';

export class ProfessionalController {
  constructor(private professionalService: ProfessionalService) {}

  public register = async (req: Request, res: Response) => {
    try {
      const { user, details, availability } = req.body;

      if (!user || !details) {
        return res.status(400).json({ error: 'Missing user or details data' });
      }

      user.role = 'health_professional';

      const result = await this.professionalService.register(user, details, availability || []);

      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      const status = error.message.includes('Invalid') ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  public listBySpecialty = async (req: Request, res: Response) => {
    try {
      const { specialty } = req.params;
      const list = await this.professionalService.listBySpecialty(specialty);
      console.log(list)
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
