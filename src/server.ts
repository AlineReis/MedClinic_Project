import { database } from "@config/database.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);

const app = createApp();

app.listen(PORT, async () => {
  try {
    await database.initialize();
    console.log(`Servidor online na PORTA ${PORT}`);
  } catch (error) {
    console.error("Falha ao iniciar a aplicação:", error);
  }
});
