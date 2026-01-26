import { Request, Response } from "express";
import { ExamService } from "../services/exam.service.js";
import { ExamRepository } from "../repository/exam.repository.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { CreateExamRequestPayload } from "../models/exam.js";

const examRepository = new ExamRepository();
const appointmentRepository = new AppointmentRepository();
const examService = new ExamService(examRepository, appointmentRepository);

export class ExamController {
  static async listCatalog(req: Request, res: Response) {
    // GET /exams/catalog
    const catalog = await examService.listCatalog();
    return res.json(catalog);
  }

  static async createRequest(req: Request, res: Response) {
    // POST /exams
    // Request vem do body. User vem do middleware de auth (req.user)
    // OBS: Implementação simplificada assumindo que req.user existe (middleware)

    const user = (req as any).user;

    // Apenas profissionais podem solicitar (RN-09)
    if (user.role !== "health_professional") {
      return res
        .status(403)
        .json({
          error: "Apenas profissionais de saúde podem solicitar exames.",
        });
    }

    const payload: CreateExamRequestPayload = {
      appointment_id: req.body.appointment_id,
      patient_id: req.body.patient_id,
      requesting_professional_id: user.id, // O profissional logado é quem solicita
      exam_catalog_id: req.body.exam_catalog_id,
      clinical_indication: req.body.clinical_indication,
      // Price vem do service
    };

    try {
      const id = await examService.createRequest(payload);
      return res
        .status(201)
        .json({ id, message: "Exame solicitado com sucesso." });
    } catch (error: any) {
      if (error.name === "ValidationError")
        return res.status(400).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      return res
        .status(500)
        .json({ error: "Erro interno ao processar solicitação." });
    }
  }

  static async listRequests(req: Request, res: Response) {
    // GET /exams
    const user = (req as any).user;
    const requests = await examService.listRequestsByContext(user);
    return res.json(requests);
  }

  static async getRequest(req: Request, res: Response) {
    // GET /exams/:id
    const user = (req as any).user;
    const id = parseInt(req.params.id);

    try {
      const request = await examService.getRequestById(id, user);
      return res.json(request);
    } catch (error: any) {
      if (error.name === "ForbiddenError")
        return res.status(403).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: "Erro interno." });
    }
  }
}
