import "dotenv/config";

interface Config {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  EMAIL_TO: string;
  ENABLE_EMAIL: boolean;
  ENABLE_JOBS: boolean;
  RESCHEDULE_FREE_WINDOW_HOURS: number;
}

function getEnv(): Config {
  const env = process.env;
  const NODE_ENV = (env.NODE_ENV as "development" | "production" | "test") || "development";

  // JWT e RESEND (se usar) são críticos apenas fora de test
  const requiredEnvs: Array<keyof NodeJS.ProcessEnv> = [];

  if (NODE_ENV !== "test") {
    requiredEnvs.push("JWT_SECRET", "RESEND_API_KEY");
    requiredEnvs.push("RESCHEDULE_FREE_WINDOW_HOURS");
  }

  for (const key of requiredEnvs) {
    if (!env[key]) {
      throw new Error(
        `❌ Erro de Configuração: Variável ${key} não definida no .env`,
      );
    }
  }

  return {
    NODE_ENV,
    PORT: parseInt(env.PORT || "3000", 10),
    JWT_SECRET: env.JWT_SECRET || "test-secret-key", // Default for tests
    RESEND_API_KEY: env.RESEND_API_KEY || "", // Opcional por padrão
    EMAIL_FROM: env.EMAIL_FROM || "onboarding@resend.dev",
    EMAIL_TO: env.EMAIL_TO || "", // Útil para testes ou fallbacks
    ENABLE_EMAIL: env.ENABLE_EMAIL === "true", // Flag para controlar envio
    ENABLE_JOBS: env.ENABLE_JOBS !== "false", // Default true, can be disabled

    // Em test, usa default 24 se não existir
    RESCHEDULE_FREE_WINDOW_HOURS: parseInt(
      env.RESCHEDULE_FREE_WINDOW_HOURS || "24",
      10,
    ),
  };
}

export const env = getEnv();
