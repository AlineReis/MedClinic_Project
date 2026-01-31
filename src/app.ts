import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import fs from "fs";
import { env } from "./config/config.js";
import { errorHandler } from "./middlewares/error.handler.js";
import routes from "./routes/index.js";

export const createApp = () => {
  const app = express();

  // Ensure uploads directory exists
  const uploadsDir = env.UPLOADS_PATH;
  if (!fs.existsSync(uploadsDir)) {
    try {
      console.log(`Creating uploads directory at: ${uploadsDir}`);
      fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
    } catch (error: any) {
      console.error(`❌ FATAL: Cannot create uploads directory: ${uploadsDir}`);
      throw new Error(`Uploads directory not writable: ${error.message}`);
    }
  }

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
  app.use("/uploads", express.static(uploadsDir));

  app.use(routes);

  app.use(errorHandler);

  return app;
};
