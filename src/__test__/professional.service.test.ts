import { jest } from '@jest/globals';
import { Availability } from '../models/professional.model.js';
import { Appointment, PaginatedResult } from '../models/appointment.js';

const mockFindByProfessionalId = jest.fn<(id: number) => Promise<Availability[]>>();
const mockFindAll = jest.fn<(filters: any, pagination: any) => Promise<PaginatedResult<Appointment>>>();

jest.unstable_mockModule("../repository/availability.repository.js", () => ({
    AvailabilityRepository: jest.fn().mockImplementation(() => ({
        findByProfessionalId: mockFindByProfessionalId
    }))
}));

jest.unstable_mockModule("../repository/appointment.repository.js", () => ({
    AppointmentRepository: jest.fn().mockImplementation(() => ({
        findAll: mockFindAll
    }))
}));

jest.unstable_mockModule("../repository/user.repository.js", () => ({
    UserRepository: jest.fn()
}));

jest.unstable_mockModule("../repository/professional.repository.js", () => ({
    ProfessionalRepository: jest.fn()
}));

let ProfessionalService: any;

describe("ProfessionalService - Availability Logic", () => {
    let service: any;

    beforeAll(async () => {
        const module = await import("../services/professional.service.js");
        ProfessionalService = module.ProfessionalService;
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        service = new ProfessionalService(
            {}, 
            {}, 
            new (await import("../repository/availability.repository.js")).AvailabilityRepository(),
            new (await import("../repository/appointment.repository.js")).AppointmentRepository()
        );
    });

    it("should generate 50-minute slots correctly", async () => {
        mockFindByProfessionalId.mockResolvedValue([
            { id: 1, professional_id: 1, day_of_week: 1, start_time: "08:00", end_time: "10:00", is_active: 1 }
        ]);
        
        mockFindAll.mockResolvedValue({ 
            data: [], 
            total: 0, 
            page: 1, 
            pageSize: 10, 
            totalPages: 0 
        });

        const slots = await service.getAvailability(1, 7);

        const mondaySlots = slots.filter((s: any) => s.time >= "08:00");
        const times = mondaySlots.map((s: any) => s.time);
        const uniqueTimes = [...new Set(times)].sort();
        
        expect(uniqueTimes).toContain("08:00");
        expect(uniqueTimes).toContain("08:50");
        expect(uniqueTimes).not.toContain("09:40");
    });

    it("should mark slots as unavailable if there is an appointment", async () => {
        mockFindByProfessionalId.mockResolvedValue([
            { id: 1, professional_id: 1, day_of_week: 1, start_time: "08:00", end_time: "10:00", is_active: 1 }
        ]);

        const today = new Date();
        const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7;
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        const dateStr = nextMonday.toISOString().split('T')[0];

        mockFindAll.mockResolvedValue({ 
            data: [
                { date: dateStr, time: "08:50", status: "scheduled", id: 1, patient_id: 1, professional_id: 1, notes: "", type: "presencial", price: 100 }
            ], 
            total: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1
        });

        const slots = await service.getAvailability(1, 14);

        const mondaySlots = slots.filter((s: any) => s.date === dateStr);
        const times = mondaySlots.map((s: any) => s.time);

        expect(times).toContain("08:00");
        expect(times).not.toContain("08:50");
    });
});

