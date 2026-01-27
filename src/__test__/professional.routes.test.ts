import express from "express";
import request from "supertest";
import { ProfessionalController } from "../controller/professional.controller.js";
import { ProfessionalService } from "../services/professional.service.js";

class FakeProfessionalService extends ProfessionalService {
  constructor() {
    super({} as any, {} as any, {} as any, {} as any);
  }

  public override async listProfessionals(
    filters: { specialty?: string; name?: string },
    page: number,
    pageSize: number
  ) {
    if (filters.name === "Gregory") {
        return [
             { id: 1, name: "Dr. Gregory House", specialty: "Diagnostic", crm: "12345" }
        ];
    }
    return [
      { id: 1, name: "Dr. Gregory House", specialty: "Diagnostic", crm: "12345" },
      { id: 2, name: "Dr. James Wilson", specialty: "Oncology", crm: "67890" },
    ];
  }

  public override async getAvailability(professionalId: number, daysAhead: number) {
     if (professionalId === 999) {
         throw new Error("Professional not found");
     }
     return [
      { date: "2024-02-01", time: "08:00", is_available: true },
      { date: "2024-02-01", time: "09:00", is_available: false },
    ];
  }
}

describe("Professional Routes Integration", () => {
  const app = express();
  app.use(express.json());

  const service = new FakeProfessionalService();
  const controller = new ProfessionalController(service);

  app.get("/professionals", controller.list);
  app.get("/professionals/:id/availability", controller.getAvailability);

  it("GET /professionals returns a list of professionals", async () => {
    const response = await request(app).get("/professionals");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toContain("Dr. Gregory");
  });

  it("GET /professionals respects filters", async () => {
    const response = await request(app).get("/professionals?name=Gregory");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("Dr. Gregory House");
  });

  it("GET /professionals/:id/availability returns slots", async () => {
    const response = await request(app).get("/professionals/1/availability?days_ahead=3");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].time).toBe("08:00");
  });

  it("GET /professionals/:id/availability handles invalid ID", async () => {
    const response = await request(app).get("/professionals/abc/availability");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid ID");
  });

  it("GET /professionals/:id/availability handles service errors", async () => {
      const response = await request(app).get("/professionals/999/availability");
      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Professional not found");
  });
});
