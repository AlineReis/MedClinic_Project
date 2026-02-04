import { AppointmentRepository } from "../repository/appointment.repository.js";
import { IEmailService, DefaultEmailService } from "./email.service.js";
import { format } from "path";

export class ReportService {
  private emailService: IEmailService;

  constructor(private appointmentRepository: AppointmentRepository) {
    this.emailService = new DefaultEmailService();
  }

  async sendFinancialReport(
    email: string,
    filters: { startDate?: string; endDate?: string },
    htmlContent?: string,
  ): Promise<void> {
    // 1. Fetch data
    const appointmentsResult = await this.appointmentRepository.findAll(
      {
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: "completed",
      },
      { page: 1, pageSize: 100000 }, // Fetch all for report
    );
    const appointments = appointmentsResult.data;

    // 2. Generate CSV
    const csvContent = this.generateCSV(appointments);

    const dateRange = `${filters.startDate || "Inicio"} a ${filters.endDate || "Fim"}`;

    const defaultHtml = `
        <h2>Relatório Financeiro</h2>
        <p>Olá,</p>
        <p>Em anexo você encontrará o relatório financeiro solicitado referente ao período <strong>${dateRange}</strong>.</p>
        <p>O arquivo está no formato CSV e pode ser aberto no Excel ou Google Sheets.</p>
    `;

    // If HTML provided, use it but maybe wrap or append
    const finalHtml = htmlContent
      ? `<h2>Relatório Financeiro - ${dateRange}</h2><hr>${htmlContent}<br><hr><p><em>Relatório gerado automaticamente por MedClinic.</em></p>`
      : defaultHtml;

    await this.emailService.send({
      to: email,
      subject: `Relatório Financeiro MedClinic: ${dateRange}`,
      html: finalHtml,
      attachments: [
        {
          filename: `Relatorio_Financeiro_${new Date().toISOString().split("T")[0]}.csv`,
          content: csvContent,
          contentType: "text/csv",
        },
      ],
    });
  }

  private generateCSV(data: any[]): string {
    if (!data || data.length === 0) return "";

    // Columns: Date, Time, Patient, Professional, Specialty, Price
    const header =
      "Data,Hora,Paciente,Profissional,Especialidade,Valor,Status\n";

    const rows = data.map((app) => {
      const date = new Date(app.date).toLocaleDateString("pt-BR");
      const time = app.time;
      const patient = this.escapeCsv(app.patient_name || "");
      const professional = this.escapeCsv(app.professional_name || "");
      const specialty = this.escapeCsv(app.specialty || "");
      const price = (app.price || 0).toFixed(2).replace(".", ",");
      const status = app.status;

      return `${date},${time},${patient},${professional},${specialty},${price},${status}`;
    });

    return header + rows.join("\n");
  }

  private escapeCsv(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
