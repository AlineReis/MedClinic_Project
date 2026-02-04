import "dotenv/config";

interface Config {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  JWT_SECRET: string;
  RESEND_API_KEY?: string; // @deprecated Switch to Nodemailer
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
  EMAIL_TO: string;
  ENABLE_EMAIL: boolean;
  RESCHEDULE_FREE_WINDOW_HOURS: number;
  ALLOWED_ORIGINS: string[];
  SEED_PASS: string;
}

function getEnv(): Config {
  const env = process.env;
  const NODE_ENV =
    (env.NODE_ENV as "development" | "production" | "test") || "development";

  // JWT e credenciais de email são críticos
  // Agora usando SMTP para Nodemailer
  const requiredEnvs: Array<keyof NodeJS.ProcessEnv> = [
    "JWT_SECRET",
    "SMTP_USER",
    "SMTP_PASS",
  ];

  // Só exigir RESCHEDULE_FREE_WINDOW_HOURS fora de test
  if (NODE_ENV !== "test") {
    requiredEnvs.push("RESCHEDULE_FREE_WINDOW_HOURS");
  }

  for (const key of requiredEnvs) {
    if (!env[key]) {
      // Aviso amigável se faltar configurações de email em dev, mas erro em produção
      if (
        (key === "SMTP_USER" || key === "SMTP_PASS") &&
        NODE_ENV === "development"
      ) {
        console.warn(
          `⚠️  Aviso: Variável ${key} não definida. O envio de emails falhará.`,
        );
      } else {
        throw new Error(
          `❌ Erro de Configuração: Variável ${key} não definida no .env`,
        );
      }
    }
  }

  return {
    NODE_ENV,
    PORT: parseInt(env.PORT || "3000", 10),
    JWT_SECRET: env.JWT_SECRET as string,
    RESEND_API_KEY: env.RESEND_API_KEY || "", // Deprecated
    SMTP_HOST: env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: parseInt(env.SMTP_PORT || "587", 10),
    SMTP_USER: env.SMTP_USER || "",
    SMTP_PASS: env.SMTP_PASS || "",
    EMAIL_FROM: env.EMAIL_FROM || "no-reply@medilux.com",
    EMAIL_TO: env.EMAIL_TO || "", // Útil para testes ou fallbacks
    ENABLE_EMAIL: env.ENABLE_EMAIL === "true", // Flag para controlar envio

    // Em test, usa default 24 se não existir
    RESCHEDULE_FREE_WINDOW_HOURS: parseInt(
      env.RESCHEDULE_FREE_WINDOW_HOURS || "24",
      10,
    ),
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      : [
          "http://localhost:8081",
          "http://localhost:8080",
          "http://localhost:3000",
          "http://localhost:80",
          "https://localhost:443",
          "http://desafio03.alphaedtech",
          "https://lab.alphaedtech.org.br/server03",
          "https://lab.alphaedtech.org.br",
        ],
    SEED_PASS: env.SEED_PASS as string,
  };
}

export const env = getEnv();
