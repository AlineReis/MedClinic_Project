import { Request, Response } from "express";
import { PrescriptionService } from "../services/prescription.service.js";
import { PrescriptionRepository } from "../repository/prescription.repository.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { CreatePrescriptionPayload } from "../models/prescription.js";

const prescriptionRepository = new PrescriptionRepository();
const appointmentRepository = new AppointmentRepository();
const prescriptionService = new PrescriptionService(
  prescriptionRepository,
  appointmentRepository,
);

export class PrescriptionController {
  static async create(req: Request, res: Response) {
    // POST /prescriptions
    const user = (req as any).user;

    // Apenas profissionais podem criar (RN-4)
    if (user.role !== "health_professional") {
      return res
        .status(403)
        .json({
          error: "Apenas profissionais de saúde podem criar prescrições.",
        });
    }

    const payload: CreatePrescriptionPayload = {
      appointment_id: req.body.appointment_id,
      patient_id: req.body.patient_id, // Pode ser validado se bate com appointment
      professional_id: user.id, // O médico logado
      medication_name: req.body.medication_name,
      dosage: req.body.dosage,
      instructions: req.body.instructions,
      is_controlled: !!req.body.is_controlled,
    };

    try {
      const id = await prescriptionService.createPrescription(payload);
      return res
        .status(201)
        .json({ id, message: "Prescrição criada com sucesso." });
    } catch (error: any) {
      if (error.name === "ValidationError")
        return res.status(400).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      if (error.name === "ForbiddenError")
        return res.status(403).json({ error: error.message });
      return res.status(500).json({ error: "Erro interno." });
    }
  }

  static async list(req: Request, res: Response) {
    // GET /prescriptions
    const user = (req as any).user;
    const list = await prescriptionService.listPrescriptionsByContext(user);
    return res.json(list);
  }

  static async getById(req: Request, res: Response) {
    // GET /prescriptions/:id
    const user = (req as any).user;
    const id = parseInt(req.params.id);

    try {
      const prescription = await prescriptionService.getPrescriptionById(
        id,
        user,
      );
      return res.json(prescription);
    } catch (error: any) {
      if (error.name === "ForbiddenError")
        return res.status(403).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: "Erro interno." });
    }
  }
}
