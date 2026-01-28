import { Resend } from "resend";
import { env } from "../config/config.js";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailService {
  send(payload: EmailPayload): Promise<void>;
}

export class ResendEmailService implements IEmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY); 
    this.fromEmail = env.EMAIL_FROM; 
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!env.ENABLE_EMAIL) {
      console.log(`📪 Email simulado para ${payload.to}: ${payload.subject}`);
      return;
    }

    if (!env.RESEND_API_KEY) {
      console.warn("⚠️  RESEND_API_KEY não configurada. Email não enviado:", payload.subject);
      return; 
    }

    // Trap Logic: Se EMAIL_TO estiver definido, ignora o destinatário original
    const recipient = env.EMAIL_TO || payload.to;
    
    if (env.EMAIL_TO) {
      console.log(`🪤 Email TRAPPED/REDIRECTED. Original: ${payload.to} -> Enviando para: ${env.EMAIL_TO}`);
    }

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: recipient,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (data.error) {
        console.error("❌ Erro ao enviar email (Resend API):", data.error);
        throw new Error(`Resend Error: ${data.error.message}`);
      }

      console.log(`📧 Email enviado com sucesso! ID: ${data.data?.id}`);
    } catch (error) {
      console.error("❌ Falha crítica no envio de email:", error);
      // Em produção, talvez você não queira derrubar a requisição se o email falhar.
      // Depende da criticidade (ex: recuperar senha TEM que enviar).
      // Aqui vamos logar e não dar throw para não travar o fluxo do usuário.
    }
  }
}
