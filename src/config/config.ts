import "dotenv/config";

interface Config {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  JWT_SECRET: string;
  RESCHEDULE_FREE_WINDOW_HOURS: number;
}

function getEnv(): Config {
  const env = process.env;

  const NODE_ENV = (env.NODE_ENV as Config["NODE_ENV"]) || "development";

  // JWT sempre obrigatório
  const requiredEnvs: Array<keyof NodeJS.ProcessEnv> = ["JWT_SECRET"];

  // Só exigir RESCHEDULE_FREE_WINDOW_HOURS fora de test
  if (NODE_ENV !== "test") {
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
    JWT_SECRET: env.JWT_SECRET as string,

    // Em test, usa default 24 se não existir
    RESCHEDULE_FREE_WINDOW_HOURS: parseInt(
      env.RESCHEDULE_FREE_WINDOW_HOURS || "24",
      10,
    ),
  };
}

export const env = getEnv();
