import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/config.js";

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  encoding?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface IEmailService {
  send(payload: EmailPayload): Promise<void>;
}

export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true para 465, false para outras
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async send(payload: EmailPayload): Promise<void> {
    const isMockMode = !env.ENABLE_EMAIL || !env.SMTP_USER || !env.SMTP_PASS;

    if (isMockMode) {
      console.log("\n" + "=".repeat(40));
      console.log("📪 [MOCK EMAIL] Envio Simulado");
      console.log("=".repeat(40));
      console.log(`Para:    ${payload.to}`);
      console.log(`Assunto: ${payload.subject}`);
      console.log("----- Conteúdo (Texto) -----");
      console.log(payload.text || "(Sem versão texto)");
      console.log("----------------------------");
      if (payload.html) {
        console.log("(Conteúdo HTML omitido no log para clareza)");
      }
      console.log("=".repeat(40) + "\n");
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM, // sender address
        to: payload.to, // list of receivers
        subject: payload.subject, // Subject line
        text: payload.text, // plain text body
        html: payload.html, // html body
        attachments: payload.attachments,
      });

      console.log(`📧 Email enviado com sucesso! MessageId: ${info.messageId}`);
    } catch (error) {
      console.error("❌ Falha no envio de email (Nodemailer):", error);
      // Não lançar erro para não quebrar fluxo do usuário, apenas logar.
    }
  }
}

/**
 * @deprecated Service using Resend API.
 * Replaced by NodemailerEmailService due to free tier limitations (requires domain).
 */
export class ResendEmailService implements IEmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
    this.fromEmail = env.EMAIL_FROM;
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!env.ENABLE_EMAIL) {
      console.log(
        `📪 Email (Resend) simulado para ${payload.to}: ${payload.subject}`,
      );
      return;
    }

    // Adaptação: Resend não suporta attachments da mesma forma simples sem processamento extra as vezes,
    // mas aqui ignoramos attachments pois esta classe está deprecated.

    // ... [Original Logic preserved below] ...
    if (!env.RESEND_API_KEY) {
      console.warn("⚠️  RESEND_API_KEY não configurada.");
      return;
    }

    const recipient = env.EMAIL_TO || payload.to;

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: recipient,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (data.error) throw new Error(data.error.message);
      console.log(`📧 Email enviado (Resend)! ID: ${data.data?.id}`);
    } catch (error) {
      console.error("❌ Falha Resend:", error);
    }
  }
}

// Export default service based on preference
export const DefaultEmailService = NodemailerEmailService;
