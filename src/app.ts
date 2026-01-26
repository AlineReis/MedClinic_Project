import { database } from "@config/database.js";
import express from "express";
import routes from "./routes/index.js";

const PORT = 3000;
const app = express();

app.use(express.json());

app.use(routes);

app.listen(PORT, async () => {
  try {
    await database.initialize();
    console.log(`Servidor online na PORTA ${PORT}`);
  } catch (error) {
    console.error("Falha ao iniciar a aplicação:", error);
  }
});
