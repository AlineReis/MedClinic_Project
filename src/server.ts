import { createApp } from "./app.js";
import { env } from './config/config.js';
import { database } from "./config/database.js";
import { startAllJobs } from "./jobs/index.js";

const PORT = Number(env.PORT ?? 3000);

const app = createApp();

app.listen(PORT, async () => {
  try {
    await database.initialize();

    // Start scheduled jobs if enabled
    if (env.ENABLE_JOBS !== false) {
      startAllJobs();
    } else {
      console.log("⏸️  Scheduled jobs disabled (ENABLE_JOBS=false)");
    }

    console.log(`Servidor online na PORTA ${PORT}`);
  } catch (error) {
    console.error("Falha ao iniciar a aplicação:", error);
  }
});
