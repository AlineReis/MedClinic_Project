import express from "express";
import request from "supertest";
import { ProfessionalController } from "../controller/professional.controller.js";
import { ProfessionalService } from "../services/professional.service.js";

class FakeProfessionalService extends ProfessionalService {
  public static lastGetAvailabilityArgs: any[] = [];
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
     FakeProfessionalService.lastGetAvailabilityArgs = [professionalId, daysAhead];
     if (professionalId === 999) {
         throw new Error("Professional not found");
     }
     return [
      { date: "2024-02-01", time: "08:00", is_available: true },
      { date: "2024-02-01", time: "09:00", is_available: false },
    ];
  }
  public override async createAvailability(professionalId: number, slots: any[]) {
      // Simples validação no mock
      for (const slot of slots) {
        if (slot.start_time >= slot.end_time) {
            throw new Error('Invalid: Start time must be before end time');
        }
      }
      return slots.map(slot => ({
          id: 123,
          professional_id: professionalId,
          ...slot,
          is_active: 1
      }));
  }
}

describe("Professional Routes Integration", () => {
  const app = express();
  app.use(express.json());

  const service = new FakeProfessionalService();
  const controller = new ProfessionalController(service);

  app.get("/professionals", controller.list);
  app.get("/professionals/:id/availability", controller.getAvailability);
  app.post("/professionals/:id/availability", controller.createAvailability);

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

  it("GET /professionals filters by specialty", async () => {
     service.listProfessionals = async (filters: any) => {
         if (filters.specialty === "Oncology") {
             return [{ id: 2, name: "Dr. James Wilson", specialty: "Oncology", crm: "67890" }];
         }
         return [];
     };

     const response = await request(app).get("/professionals?specialty=Oncology");
     expect(response.status).toBe(200);
     expect(response.body).toHaveLength(1);
     expect(response.body[0].specialty).toBe("Oncology");
  });


  it("GET /professionals/:id/availability returns slots with default 7 days", async () => {
    FakeProfessionalService.lastGetAvailabilityArgs = []; // Reset
    
    const response = await request(app).get("/professionals/1/availability"); // No query param
    expect(response.status).toBe(200);
    expect(FakeProfessionalService.lastGetAvailabilityArgs).toEqual([1, 7]);
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

  it("POST /professionals/:id/availability creates new slots (batch)", async () => {
    const response = await request(app).post("/professionals/1/availability").send({
        availabilities: [
            { day_of_week: 1, start_time: "08:00", end_time: "12:00" },
            { day_of_week: 2, start_time: "14:00", end_time: "18:00" }
        ]
    });
    expect(response.status).toBe(201);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(123);
  });

  it("POST /professionals/:id/availability returns 400 for invalid data in batch", async () => {
      const response = await request(app).post("/professionals/1/availability").send({
          availabilities: [
            { day_of_week: 1, start_time: "12:00", end_time: "08:00" } // Invalid
          ]
      });
      expect(response.status).toBe(400); 
  });

  it("POST /professionals/:id/availability rejects overlapping slots", async () => {
      service.createAvailability = async (id: number, slots: any[]) => {
          throw new Error('Overlaps with existing rule');
      };

      const response = await request(app).post("/professionals/1/availability").send({
          availabilities: [
             { day_of_week: 1, start_time: "08:00", end_time: "10:00" } 
          ]
      });
      
      expect(response.status).toBe(400); 
      expect(response.body.error).toContain("Overlaps");
  });
});
