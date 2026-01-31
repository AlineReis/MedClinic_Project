import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/config.js";
import { errorHandler } from "./middlewares/error.handler.js";
import routes from "./routes/index.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS,
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
