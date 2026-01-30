import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.handler.js";
import routes from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [
        "http://localhost:8081", 
        "http://localhost:8080", 
        "http://localhost:3000",
      ],
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.use(routes);

  app.use(errorHandler);

  return app;
};
