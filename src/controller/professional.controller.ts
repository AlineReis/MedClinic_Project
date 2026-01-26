import { Request, Response } from 'express';
import { ProfessionalService } from '../services/professional.service.js';

const profService = new ProfessionalService();

export class ProfessionalController {

  static async register(req: Request, res: Response) {
    try {
      const { user, details, availability } = req.body;

      if (!user || !details) {
        return res.status(400).json({ error: 'Missing user or details data' });
      }

      user.role = 'health_professional';

      const result = await profService.register(user, details, availability || []);

      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      const status = error.message.includes('Invalid') ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async listBySpecialty(req: Request, res: Response) {
    try {
      const { specialty } = req.params;
      const list = await profService.listBySpecialty(specialty);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
