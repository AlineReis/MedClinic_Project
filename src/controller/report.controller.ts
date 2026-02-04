import { Request, Response } from "express";
import { ReportService } from "../services/report.service.js";

export class ReportController {
  constructor(private reportService: ReportService) {}

  public sendFinancialReport = async (req: Request, res: Response) => {
    // POST /reports/financial/email
    const user = (req as any).user;
    const { startDate, endDate, htmlContent } = req.body;

    // Only Admin
    if (!["clinic_admin", "system_admin"].includes(user.role)) {
      return res
        .status(403)
        .json({ error: "Apenas administradores podem gerar relatórios." });
    }

    try {
      // Send to user's email
      if (!user.email) {
        return res
          .status(400)
          .json({ error: "Seu usuário não possui email cadastrado." });
      }

      await this.reportService.sendFinancialReport(
        user.email,
        {
          startDate,
          endDate,
        },
        htmlContent,
      );

      return res.json({
        success: true,
        message: `Relatório enviado para ${user.email}.`,
      });
    } catch (error: any) {
      console.error("Report Generation Error:", error);
      return res.status(500).json({ error: "Erro ao gerar relatório." });
    }
  };
}
