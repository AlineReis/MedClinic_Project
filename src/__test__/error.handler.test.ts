import express from "express";
import request from "supertest";
import { errorHandler } from "../middlewares/error.handler.js";
import { AppError, ValidationError } from "../utils/errors.js";

const createAppWithMiddleware = () => {
  const app = express();
  app.use(express.json());

  // Adiciona rotas de teste ANTES do middleware de tratamento de erros
  app.get("/test-error/validation", () => {
    throw new ValidationError("Invalid data", "test_field");
  });

  app.get("/test-error/unknown", () => {
    throw new Error("Something went wrong");
  });

  app.get("/test-error/app-error", () => {
    class CustomError extends AppError {
      statusCode = 418;
      code = "TEAPOT_ERROR";
      constructor() {
        super("I am a teapot");
      }
    }
    throw new CustomError();
  });

  // Registra o middleware de tratamento de erros
  app.use(errorHandler);

  return app;
};

const app = createAppWithMiddleware();

describe("Global Error Handler", () => {
  it("should handle known AppErrors (ValidationError)", async () => {
    const res = await request(app).get("/test-error/validation");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid data",
        field: "test_field",
      },
    });
  });

  it("should handle unknown errors as 500", async () => {
    const res = await request(app).get("/test-error/unknown");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal Server Error",
      },
    });
  });

  it("should handle custom AppErrors", async () => {
    const res = await request(app).get("/test-error/app-error");

    expect(res.status).toBe(418);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: "TEAPOT_ERROR",
        message: "I am a teapot",
      },
    });
  });
});
