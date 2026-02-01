import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";

import { InMemoryUserRepository } from "@repositories/users-in-memory.repository.js";
import { AuthController } from "../controller/auth.controller.js";
import type { AuthResult, UserRole } from "../models/user.js";
import { AuthService } from "../services/auth.service.js";
import { ValidationError } from "../utils/errors.js";

class FakeAuthService extends AuthService {
  public override async registerPatient(payload: any): Promise<AuthResult> {
    if (!payload.email) {
      throw new ValidationError("Email format is invalid", "email");
    }
    const role: UserRole = "patient";
    return {
      id: 1,
      name: payload.name ?? "Patient",
      email: payload.email,
      role,
      clinic_id: null,
    };
  }

  public override async login(email: string, password: string) {
    if (!email || !password) {
      throw new ValidationError("Invalid credentials", "email");
    }
    const role: UserRole = "patient";
    return {
      token: "mock-token",
      user: { id: 1, name: "Patient", email, role, clinic_id: null },
    };
  }
}

describe("AuthController routes", () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  const controller = new AuthController(
    new FakeAuthService(new InMemoryUserRepository()),
  );

  app.post("/auth/register", controller.register);
  app.post("/auth/login", controller.login);
  // Middleware que lida com erros
  //   app.use(errorHandler);

  it("register returns 201 with user payload", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Maria",
      email: "maria@medclinic.com",
      password: "Senha@123",
      role: "patient",
      cpf: "123.456.789-10",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe("maria@medclinic.com");
  });

  it("login returns 200 and sets cookie", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "maria@medclinic.com",
      password: "Senha@123",
    });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toBeDefined();
  });
});
