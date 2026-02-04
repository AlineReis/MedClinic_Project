import { env } from "../config/config.js";
import { NodemailerEmailService } from "../services/email.service.js";

import { getAppointmentEmailHtml } from "../utils/email-templates.js";

async function main() {
  console.log("Iniciando Teste de Email...");

  const mailer = new NodemailerEmailService();
  const testEmail = env.EMAIL_TO;

  if (!testEmail) {
    throw new Error("❌ EMAIL_TO não definido no .env");
  }

  // Dados Mock para teste visual
  const emailHtml = getAppointmentEmailHtml({
    patientName: "Carlos Ferreira",
    doctorName: "Dra. Helena",
    date: "25/10/2023",
    time: "14:00",
    type: "presencial",
    confirmLink: "https://medclinic.com/confirm?id=123",
    cancelLink: "https://medclinic.com/appointments/123"
  });

  await mailer.send({
    to: testEmail,
    subject: "Confirmação de Agendamento - MedClinic 🏥",
    html: emailHtml,
  });

  console.log("🏁 Teste finalizado.");
}

main();
