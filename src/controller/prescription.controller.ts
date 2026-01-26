import { Request, Response } from "express";
import { CreatePrescriptionPayload } from "../models/prescription.js";
import { PrescriptionService } from "../services/prescription.service.js";

export class PrescriptionController {
  constructor(private prescriptionService: PrescriptionService) {}

  public create = async (req: Request, res: Response) => {
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
      const id = await this.prescriptionService.createPrescription(payload);
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

  public list = async (req: Request, res: Response) => {
    // GET /prescriptions
    const user = (req as any).user;
    const list = await this.prescriptionService.listPrescriptionsByContext(user);
    return res.json(list);
  }

  public getById = async (req: Request, res: Response) => {
    // GET /prescriptions/:id
    const user = (req as any).user;
    const id = parseInt(req.params.id);

    try {
      const prescription = await this.prescriptionService.getPrescriptionById(
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
