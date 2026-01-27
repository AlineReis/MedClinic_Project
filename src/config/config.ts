import 'dotenv/config';

interface Config {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  JWT_SECRET: string;
}

function getEnv(): Config {
  const env = process.env;

  const requiredEnvs: Array<keyof NodeJS.ProcessEnv> = [
    'JWT_SECRET'
  ];

  for (const key of requiredEnvs) {
    if (!env[key]) {
      throw new Error(`❌ Erro de Configuração: Variável ${key} não definida no .env`);
    }
  }

  return {
    NODE_ENV: (env.NODE_ENV as Config['NODE_ENV']) || 'development',
    PORT: parseInt(env.PORT || '3000', 10),
    JWT_SECRET: env.JWT_SECRET as string,
  };
}

export const env = getEnv();
