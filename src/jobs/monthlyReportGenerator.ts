import cron from "node-cron";
import { database } from "../config/database.js";
import { MonthlyReportRepository } from "../repository/monthly-report.repository.js";
import { ResendEmailService } from "../services/email.service.js";

/**
 * RN-28: Automatic Monthly Commission Report Generation
 * Generates monthly commission reports for all health professionals
 * Runs on the 1st day of every month at midnight
 */
export function startMonthlyReportGeneratorJob() {
  // Run on the 1st day of every month at midnight
  cron.schedule("0 0 1 * *", async () => {
    console.log("[CRON] Running monthly report generator job...");

    try {
      // Calculate previous month and year
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = lastMonth.getMonth() + 1;
      const year = lastMonth.getFullYear();

      console.log(`[CRON] Generating reports for ${month}/${year}`);

      // Get all health professionals
      const professionals = await database.query<{
        id: number;
        name: string;
        email: string;
      }>(
        `
        SELECT id, name, email
        FROM users
        WHERE role = 'health_professional'
          AND deleted_at IS NULL
        ORDER BY name
      `,
        [],
      );

      if (professionals.length === 0) {
        console.log("[CRON] No health professionals found");
        return;
      }

      console.log(
        `[CRON] Found ${professionals.length} health professional(s)`,
      );

      const reportRepository = new MonthlyReportRepository();
      const emailService = new ResendEmailService();

      let successCount = 0;
      let failCount = 0;
      let totalCommissions = 0;
      let totalAppointments = 0;

      // Generate reports for each professional
      for (const professional of professionals) {
        try {
          // Check if report already exists
          const existingReports = await reportRepository.findByProfessional(
            professional.id,
            { month, year },
          );

          if (existingReports.length > 0) {
            console.log(
              `⚠️  Report already exists for ${professional.name} (${month}/${year})`,
            );
            continue;
          }

          // Generate the report
          const reportId = await reportRepository.generateReport(
            professional.id,
            month,
            year,
          );

          // Fetch the generated report
          const report = await reportRepository.findById(reportId);

          if (!report) {
            throw new Error("Failed to retrieve generated report");
          }

          // Accumulate totals for admin summary
          totalCommissions += report.total_commission;
          totalAppointments += report.total_appointments;

          // Send email to professional (only if email is enabled)
          if (process.env.ENABLE_EMAIL !== "false") {
            const recipientEmail =
              process.env.EMAIL_TO || professional.email;

            await emailService.send({
              to: recipientEmail,
              subject: `Relatório Mensal de Comissões - ${getMonthName(month)}/${year} - MediLux`,
              html: getMonthlyReportEmailHtml({
                professionalName: professional.name,
                month,
                year,
                totalAppointments: report.total_appointments,
                totalGross: report.total_gross_amount,
                totalNet: report.total_net_amount,
                totalCommission: report.total_commission,
                totalDeductions: report.total_deductions,
              }),
            });
          }

          successCount++;
          console.log(
            `✅ Report generated and sent to ${professional.name} (ID: ${reportId})`,
          );
        } catch (err: any) {
          failCount++;
          console.error(
            `❌ Failed to generate report for ${professional.name}:`,
            err.message,
          );
        }
      }

      console.log(
        `[CRON] Report generation completed: ${successCount} successful, ${failCount} failed`,
      );

      // Send summary email to admins
      if (successCount > 0 && process.env.ENABLE_EMAIL !== "false") {
        await sendAdminSummaryEmail(
          emailService,
          month,
          year,
          professionals.length,
          successCount,
          totalCommissions,
          totalAppointments,
        );
      }
    } catch (error: any) {
      console.error("[CRON] Monthly report generator job error:", error.message);
    }
  });

  console.log(
    "✅ Monthly report generator job scheduled (1st of month at midnight)",
  );
}

/**
 * Send summary email to clinic admins
 */
async function sendAdminSummaryEmail(
  emailService: ResendEmailService,
  month: number,
  year: number,
  totalProfessionals: number,
  totalReportsGenerated: number,
  totalCommissions: number,
  totalAppointments: number,
) {
  try {
    // Get all clinic admins
    const admins = await database.query<{
      id: number;
      name: string;
      email: string;
    }>(
      `
      SELECT id, name, email
      FROM users
      WHERE role IN ('clinic_admin', 'system_admin')
        AND deleted_at IS NULL
    `,
      [],
    );

    if (admins.length === 0) {
      console.log("[CRON] No admins found to send summary email");
      return;
    }

    const recipientEmails = admins.map((admin) => admin.email).join(",");
    const finalRecipient = process.env.EMAIL_TO || recipientEmails;

    await emailService.send({
      to: finalRecipient,
      subject: `Resumo: Relatórios de ${getMonthName(month)}/${year} Gerados - MediLux`,
      html: getAdminSummaryEmailHtml({
        month,
        year,
        totalProfessionals,
        totalReportsGenerated,
        totalCommissions,
        totalAppointments,
      }),
    });

    console.log(`✅ Admin summary email sent to ${admins.length} admin(s)`);
  } catch (err: any) {
    console.error("❌ Failed to send admin summary email:", err.message);
  }
}

/**
 * Get month name in Portuguese
 */
function getMonthName(month: number): string {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return monthNames[month - 1] || "Desconhecido";
}

/**
 * Format currency for email
 */
function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/**
 * Email template for monthly report (professional)
 */
function getMonthlyReportEmailHtml(props: {
  professionalName: string;
  month: number;
  year: number;
  totalAppointments: number;
  totalGross: number;
  totalNet: number;
  totalCommission: number;
  totalDeductions: number;
}): string {
  const monthName = getMonthName(props.month);
  const primaryColor = "#3B82F6";
  const secondaryColor = "#1E293B";
  const textGray = "#64748B";
  const successColor = "#10B981";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Mensal - MediLux</title>
</head>
<body style="background-color: #F1F5F9; margin: 0; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="padding: 32px 40px; border-bottom: 1px solid #E2E8F0;">
        <h2 style="margin: 0; color: ${primaryColor}; font-size: 24px; font-weight: 700;">
          <span style="font-size: 28px;">✚</span> MediLux
        </h2>
        <span style="background-color: #D1FAE5; color: ${successColor}; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; display: inline-block; margin-top: 8px;">📊 Relatório Mensal</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h1 style="margin: 0 0 8px; color: ${secondaryColor}; font-size: 24px;">Olá, ${props.professionalName}</h1>
        <p style="margin: 0 0 32px; color: ${textGray}; font-size: 16px;">
          Seu relatório de comissões referente a <strong>${monthName}/${props.year}</strong> foi gerado.
        </p>
        <div style="background-color: ${primaryColor}; border-radius: 12px; padding: 24px; margin-bottom: 24px; color: white;">
          <p style="margin: 0 0 8px; font-size: 14px; opacity: 0.9;">Total a Receber</p>
          <p style="margin: 0; font-size: 36px; font-weight: 700;">${formatCurrency(props.totalCommission)}</p>
        </div>
        <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 4px; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Consultas Realizadas</p>
          <p style="margin: 0; color: ${secondaryColor}; font-size: 24px; font-weight: 700;">${props.totalAppointments}</p>
        </div>
        <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 4px; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Valor Bruto</p>
          <p style="margin: 0; color: ${secondaryColor}; font-size: 20px; font-weight: 700;">${formatCurrency(props.totalGross)}</p>
        </div>
        <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="margin: 0 0 4px; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Valor Líquido</p>
          <p style="margin: 0; color: ${secondaryColor}; font-size: 20px; font-weight: 700;">${formatCurrency(props.totalNet)}</p>
        </div>
        <div style="background-color: #F8FAFC; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; color: #94A3B8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Deduções (MDR)</p>
          <p style="margin: 0; color: #DC2626; font-size: 20px; font-weight: 700;">${formatCurrency(props.totalDeductions)}</p>
        </div>
        <div style="background-color: #EFF6FF; border-radius: 12px; padding: 20px;">
          <p style="margin: 0; color: ${primaryColor}; font-size: 12px;">
            <strong>💡 Informação:</strong> Este relatório está disponível no portal da clínica para mais detalhes.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #F8FAFC; padding: 24px 40px; text-align: center; border-top: 1px solid #E2E8F0;">
        <p style="margin: 0; color: #94A3B8; font-size: 12px;">© ${new Date().getFullYear()} MediLux. Todos os direitos reservados.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Email template for admin summary
 */
function getAdminSummaryEmailHtml(props: {
  month: number;
  year: number;
  totalProfessionals: number;
  totalReportsGenerated: number;
  totalCommissions: number;
  totalAppointments: number;
}): string {
  const monthName = getMonthName(props.month);
  const primaryColor = "#3B82F6";
  const secondaryColor = "#1E293B";
  const textGray = "#64748B";
  const successColor = "#10B981";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumo de Relatórios - MediLux</title>
</head>
<body style="background-color: #F1F5F9; margin: 0; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="padding: 32px 40px; border-bottom: 1px solid #E2E8F0;">
        <h2 style="margin: 0; color: ${primaryColor}; font-size: 24px; font-weight: 700;">
          <span style="font-size: 28px;">✚</span> MediLux
        </h2>
        <p style="margin: 4px 0 0; color: ${textGray}; font-size: 12px; font-weight: 500; text-transform: uppercase;">Administrativo</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h1 style="margin: 0 0 8px; color: ${secondaryColor}; font-size: 24px;">Relatórios de ${monthName}/${props.year} Gerados</h1>
        <p style="margin: 0 0 32px; color: ${textGray}; font-size: 16px;">
          Os relatórios mensais de comissão foram gerados automaticamente e enviados aos profissionais.
        </p>
        <div style="background-color: #F0FDF4; border-left: 4px solid ${successColor}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 16px; color: #065F46; font-size: 14px; font-weight: 600;">RESUMO EXECUTIVO</p>
          <p style="margin: 8px 0; color: ${textGray}; font-size: 14px;">
            Relatórios Gerados: <strong style="color: ${secondaryColor}; font-size: 18px;">${props.totalReportsGenerated}</strong>
          </p>
          <p style="margin: 8px 0; color: ${textGray}; font-size: 14px;">
            Total de Comissões: <strong style="color: ${successColor}; font-size: 20px;">${formatCurrency(props.totalCommissions)}</strong>
          </p>
          <p style="margin: 8px 0; color: ${textGray}; font-size: 14px;">
            Consultas do Período: <strong style="color: ${secondaryColor}; font-size: 18px;">${props.totalAppointments}</strong>
          </p>
        </div>
        <div style="background-color: #EFF6FF; border-radius: 12px; padding: 20px;">
          <p style="margin: 0; color: ${primaryColor}; font-size: 12px;">
            <strong>📋 Próximos passos:</strong> Acesse o sistema para revisar os relatórios individuais e processar os pagamentos.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #F8FAFC; padding: 24px 40px; text-align: center; border-top: 1px solid #E2E8F0;">
        <p style="margin: 0; color: #94A3B8; font-size: 12px;">© ${new Date().getFullYear()} MediLux. Sistema Automatizado de Gestão</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
