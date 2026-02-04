import { Request, Response } from "express";
import { CreateExamRequestPayload } from "../models/exam.js";
import { ExamService } from "../services/exam.service.js";

export class ExamController {
  constructor(private examService: ExamService) {}

  public listCatalog = async (req: Request, res: Response) => {
    // GET /exams/catalog
    const catalog = await this.examService.listCatalog();
    return res.json({ success: true, data: catalog });
  };

  public createRequest = async (req: Request, res: Response) => {
    // POST /exams
    // Request vem do body. User vem do middleware de auth (req.user)
    // OBS: Implementação simplificada assumindo que req.user existe (middleware)

    const user = (req as any).user;

    // Apenas profissionais podem solicitar (RN-09)
    if (user.role !== "health_professional") {
      return res.status(403).json({
        success: false,
        error: {
          message: "Apenas profissionais de saúde podem solicitar exames.",
        },
      });
    }

    const payload: CreateExamRequestPayload = {
      appointment_id: req.body.appointment_id,
      patient_id: req.body.patient_id,
      requesting_professional_id: user.id, // O profissional logado é quem solicita
      exam_catalog_id: req.body.exam_catalog_id,
      clinical_indication: req.body.clinical_indication,
      urgency: req.body.urgency,
      // Price vem do service
    };

    try {
      const id = await this.examService.createRequest(payload);
      // NOTE: Frontend expects the full object, but we only have ID here.
      // Ideally we should return the created object. For now keeping minimal change but wrapping.
      return res.status(201).json({
        success: true,
        data: { id },
        message: "Exame solicitado com sucesso.",
      });
    } catch (error: any) {
      if (error.name === "ValidationError")
        return res
          .status(400)
          .json({ success: false, error: { message: error.message } });
      if (error.name === "NotFoundError")
        return res
          .status(404)
          .json({ success: false, error: { message: error.message } });
      console.error("Exam Creation Error:", error); // Debugging 500 error
      return res.status(500).json({
        success: false,
        error: {
          message:
            "Erro interno ao processar solicitação: " +
            (error.message || "Unknown"),
        },
      });
    }
  };

  public listRequests = async (req: Request, res: Response) => {
    // GET /exams
    const user = (req as any).user;
    const requests = await this.examService.listRequestsByContext(user);
    return res.json({ success: true, data: requests });
  };

  public getRequest = async (req: Request, res: Response) => {
    // GET /exams/:id
    const user = (req as any).user;
    const id = parseInt(req.params.id);

    try {
      const request = await this.examService.getRequestById(id, user);
      return res.json({ success: true, data: request });
    } catch (error: any) {
      if (error.name === "ForbiddenError")
        return res
          .status(403)
          .json({ success: false, error: { message: error.message } });
      if (error.name === "NotFoundError")
        return res
          .status(404)
          .json({ success: false, error: { message: error.message } });
      return res
        .status(500)
        .json({ success: false, error: { message: "Erro interno." } });
    }
  };

  /**
   * Phase 5: POST /exams/:id/schedule
   * Schedule exam collection
   */
  public schedule = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const id = parseInt(req.params.id);
    const { scheduled_date } = req.body;

    if (!scheduled_date) {
      return res.status(400).json({ error: "Data agendada é obrigatória." });
    }

    try {
      await this.examService.scheduleExam(id, scheduled_date, user);
      return res
        .status(200)
        .json({ success: true, message: "Exame agendado com sucesso." });
    } catch (error: any) {
      if (error.name === "ForbiddenError")
        return res.status(403).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      if (error.name === "ValidationError")
        return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: "Erro interno." });
    }
  };

  /**
   * Phase 5: GET /exams/:id/download
   * Download exam result
   */
  public download = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const id = parseInt(req.params.id);

    try {
      const result = await this.examService.downloadResult(id, user);
      return res.json({
        success: true,
        result_file_url: result.result_file_url,
        result_text: result.result_text,
      });
    } catch (error: any) {
      if (error.name === "ForbiddenError")
        return res.status(403).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      if (error.name === "ValidationError")
        return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: "Erro interno." });
    }
  };

  // Issue #506: Upload de laudo
  public uploadResult = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const examId = parseInt(req.params.id);
    const file = (req as any).file; // Vem do multer

    if (!file) {
      return res.status(400).json({ error: "Arquivo não enviado." });
    }

    // Construir URL do arquivo (simplificado)
    const fileUrl = `/uploads/exam-results/${file.filename}`;

    try {
      await this.examService.uploadResult(examId, fileUrl, user);
      return res.json({
        success: true,
        message: "Laudo enviado com sucesso.",
        file_url: fileUrl,
      });
    } catch (error: any) {
      if (error.name === "ForbiddenError")
        return res.status(403).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      if (error.name === "ValidationError")
        return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: "Erro ao processar upload." });
    }
  };

  // Issue #506: Liberar resultado
  public releaseResult = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const examId = parseInt(req.params.id);

    try {
      await this.examService.releaseResult(examId, user);
      return res.json({
        success: true,
        message: "Resultado liberado com sucesso.",
      });
    } catch (error: any) {
      if (error.name === "ForbiddenError")
        return res.status(403).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      if (error.name === "ValidationError")
        return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: "Erro ao liberar resultado." });
    }
  };

  /**
   * Feature: Send exam result by email
   * POST /exams/:id/email
   */
  public sendResultEmail = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const examId = parseInt(req.params.id);

    try {
      await this.examService.sendExamResultEmail(examId, user);
      return res.json({
        success: true,
        message: "Resultado enviado por email com sucesso.",
      });
    } catch (error: any) {
      if (error.name === "ForbiddenError")
        return res.status(403).json({ error: error.message });
      if (error.name === "NotFoundError")
        return res.status(404).json({ error: error.message });
      if (error.name === "ValidationError")
        return res.status(400).json({ error: error.message });
      console.error("Email API Failed:", error);
      return res.status(500).json({ error: "Erro ao enviar email." });
    }
  };
}
