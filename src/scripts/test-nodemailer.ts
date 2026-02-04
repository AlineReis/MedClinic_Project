import { DefaultEmailService } from "../services/email.service.js";
import {
  getPasswordResetEmailHtml,
  getVerificationCodeEmailHtml,
} from "../utils/email-templates.js";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Iniciando Teste de Nodemailer...");

  const mailer = new DefaultEmailService();
  const testEmail = process.env.EMAIL_TO || process.env.SMTP_USER;

  if (!testEmail) {
    console.error("❌ ERRO: Para testar, defina EMAIL_TO ou SMTP_USER no .env");
    process.exit(1);
  }

  console.log(`📨 Enviando para: ${testEmail}`);

  // 1. Teste de Recuperação de Senha
  console.log("1️⃣  Enviando Email de Recuperação de Senha...");
  await mailer.send({
    to: testEmail,
    subject: "Recuperação de Senha - Teste",
    html: getPasswordResetEmailHtml(
      "Usuário Teste",
      "https://medilux.com/reset?token=123",
    ),
  });

  // 2. Teste de Código de Verificação
  console.log("2️⃣  Enviando Código de Verificação...");
  await mailer.send({
    to: testEmail,
    subject: "Seu Código - Teste",
    html: getVerificationCodeEmailHtml("123456"),
  });

  // 3. Teste de Anexo (Criando um arquivo fake)
  console.log("3️⃣  Enviando Email com Anexo...");
  const fakePdfPath = path.resolve("test-attachment.txt");
  fs.writeFileSync(fakePdfPath, "Conteúdo do relatório simulado.");

  try {
    await mailer.send({
      to: testEmail,
      subject: "Relatório Mensal - Teste Anexo",
      html: "<p>Segue em anexo o relatório solicitado.</p>",
      attachments: [
        {
          filename: "relatorio.txt",
          content: fs.readFileSync(fakePdfPath),
          contentType: "text/plain",
        },
      ],
    });
  } finally {
    fs.unlinkSync(fakePdfPath);
  }

  console.log("🏁 Testes finalizados! Verifique sua caixa de entrada.");
}

main().catch(console.error);
