import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler } from "./middlewares/error.handler.js";
import routes from "./routes/index.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [
        "http://localhost:8081",
        "http://localhost:8080",
        "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:80",
        "https://localhost:443",
      ],
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.use(routes);

  app.use(errorHandler);

  return app;
};
