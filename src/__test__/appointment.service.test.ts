import { AppointmentService } from '../services/appointment.service.js';
import { AppointmentRepository } from '../repository/appointment.repository.js';
import { AvailabilityRepository } from '../repository/availability.repository.js';
import { Appointment } from '../models/appointment.js';
import { Availability } from '../models/professional.model.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock types
jest.mock('../repository/appointment.repository.js');
jest.mock('../repository/availability.repository.js');
jest.mock('../repository/availability.repository.js');

describe('AppointmentService', () => {
    let appointmentService: AppointmentService;
    let appointmentRepositoryMock: jest.Mocked<AppointmentRepository>;
    let availabilityRepositoryMock: jest.Mocked<AvailabilityRepository>;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        appointmentRepositoryMock = {
            create: jest.fn(),
            checkConflict: jest.fn(),
            findById: jest.fn(),
            findByPatientId: jest.fn(),
            findByProfessionalId: jest.fn(),
            findAll: jest.fn(),
            updateStatus: jest.fn(),
            cancel: jest.fn(),
            updatePaymentStatus: jest.fn()
        } as unknown as jest.Mocked<AppointmentRepository>;

        availabilityRepositoryMock = {
            create: jest.fn(),
            findByProfessionalId: jest.fn(),
            deleteByProfessionalId: jest.fn()
        } as unknown as jest.Mocked<AvailabilityRepository>;

        appointmentService = new AppointmentService(appointmentRepositoryMock, availabilityRepositoryMock);
    });

    describe('scheduleAppointment', () => {
        const validAppointmentData: Appointment = {
            patient_id: 1,
            professional_id: 2,
            date: '2026-03-10', // A future Tuesday
            time: '14:30',
            type: 'presencial',
            price: 150
        };

        const mockAvailability: Availability[] = [
            {
                id: 1,
                professional_id: 2,
                day_of_week: 2, // Tuesday
                start_time: '09:00',
                end_time: '18:00',
                is_active: 1
            }
        ];

        it('should successfully schedule an appointment when time is within availability', async () => {
            // Mock findByProfessionalId to return availability
            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);

            // Mock checkConflict to return false (no conflict)
            appointmentRepositoryMock.checkConflict.mockResolvedValue(false);

            // Mock create to return a new ID
            appointmentRepositoryMock.create.mockResolvedValue(123);

            const result = await appointmentService.scheduleAppointment(validAppointmentData);

            expect(result).toBe(123);
            expect(availabilityRepositoryMock.findByProfessionalId).toHaveBeenCalledWith(2);
            expect(appointmentRepositoryMock.create).toHaveBeenCalledWith(validAppointmentData);
        });

        it('should throw ValidationError when professional does not work on that day', async () => {
            const wednesdayAppointment = { ...validAppointmentData, date: '2026-03-11' }; // Wednesday

            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);

            await expect(appointmentService.scheduleAppointment(wednesdayAppointment))
                .rejects
                .toThrow(new ValidationError("O profissional não atende neste dia da semana.", "availability"));
        });

        it('should throw ValidationError when time is before start_time', async () => {
            const earlyAppointment = { ...validAppointmentData, time: '08:30' };

            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);

            await expect(appointmentService.scheduleAppointment(earlyAppointment))
                .rejects
                .toThrow(new ValidationError("O horário escolhido está fora do expediente do profissional.", "availability"));
        });

        it('should throw ValidationError when time is after end_time', async () => {
            const lateAppointment = { ...validAppointmentData, time: '18:30' };

            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);

            await expect(appointmentService.scheduleAppointment(lateAppointment))
                .rejects
                .toThrow(new ValidationError("O horário escolhido está fora do expediente do profissional.", "availability"));
        });

        it('should throw ValidationError when time is exactly equal to end_time', async () => {
            // Assuming open interval [start, end)
            const boundaryAppointment = { ...validAppointmentData, time: '18:00' };

            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);

            await expect(appointmentService.scheduleAppointment(boundaryAppointment))
                .rejects
                .toThrow(new ValidationError("O horário escolhido está fora do expediente do profissional.", "availability"));
        });

        it('should throw ValidationError for past dates', async () => {
            const pastAppointment = { ...validAppointmentData, date: '2020-01-01' };

            await expect(appointmentService.scheduleAppointment(pastAppointment))
                .rejects
                .toThrow(new ValidationError("O agendamento deve ser para uma data futura.", "date"));
        });

        // RN-02 Tests
        it('should throw ValidationError for in-person appointment less than 2 hours in advance', async () => {
            // Mock current time to be close to appointment time
            const appointmentDate = new Date(`${validAppointmentData.date}T${validAppointmentData.time}`);
            const oneHourBefore = new Date(appointmentDate.getTime() - 1 * 60 * 60 * 1000); // 1 hour notice

            jest.useFakeTimers();
            jest.setSystemTime(oneHourBefore);

            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);

            await expect(appointmentService.scheduleAppointment(validAppointmentData))
                .rejects
                .toThrow(new ValidationError("Agendamentos presenciais devem ser feitos com no mínimo 2 horas de antecedência.", "date"));

            jest.useRealTimers();
        });

        it('should allow online appointment less than 2 hours in advance', async () => {
            // Mock current time to be close to appointment time
            const appointmentDate = new Date(`${validAppointmentData.date}T${validAppointmentData.time}`);
            const oneHourBefore = new Date(appointmentDate.getTime() - 1 * 60 * 60 * 1000); // 1 hour notice

            jest.useFakeTimers();
            jest.setSystemTime(oneHourBefore);

            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);
            appointmentRepositoryMock.checkConflict.mockResolvedValue(false);
            appointmentRepositoryMock.create.mockResolvedValue(123);

            const onlineAppointment = { ...validAppointmentData, type: 'online' as const };
            const result = await appointmentService.scheduleAppointment(onlineAppointment);

            expect(result).toBe(123);

            jest.useRealTimers();
        });
    });
});
