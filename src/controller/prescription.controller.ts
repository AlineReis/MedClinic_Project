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
    
    // Inject mock data for UI testing (Requested by User)
    if (user.role === "patient" && Array.isArray(list)) {
      list.push(
        {
          id: 99901,
          medication_name: "Ibuprofeno 600mg (Teste Scroll)",
          dosage: "Tomar 1 comp a cada 8h se dor",
          created_at: new Date().toISOString(),
          instructions: "Ingerir com alimentos",
          is_controlled: false,
          professional_name: "Dr. Mock"
        } as any,
        {
          id: 99902,
          medication_name: "Vitamina C 1g efervescente",
          dosage: "1 comprimido ao dia pela manhã",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          instructions: "Dissolver em água",
          is_controlled: false,
          professional_name: "Dr. Mock"
        } as any,
        {
          id: 99903,
          medication_name: "Xarope Expectorante",
          dosage: "10ml a cada 6 horas",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          instructions: "Agite antes de usar",
          is_controlled: false,
          professional_name: "Dr. Mock"
        } as any
      );
    }

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
