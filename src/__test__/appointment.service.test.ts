import { AppointmentRepository } from '../repository/appointment.repository.js';
import { AvailabilityRepository } from '../repository/availability.repository.js';
import { UserRepository } from '../repository/user.repository.js';
import { TransactionRepository } from '../repository/transaction.repository.js';
import { CommissionSplitRepository } from '../repository/commission-split.repository.js';
import { PaymentMockService } from '../services/payment-mock.service.js';
import { AppointmentService } from '../services/appointment.service.js';

import { ResendEmailService } from '../services/email.service.js';

import { Appointment } from '../models/appointment.js';
import { Availability } from '../models/professional.model.js';
import { User } from '../models/user.js';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError, ValidationError } from '../utils/errors.js';

// Mock types
jest.mock('../repository/appointment.repository.js');
jest.mock('../repository/availability.repository.js');
jest.mock('../repository/user.repository.js');
jest.mock('../repository/transaction.repository.js');
jest.mock('../repository/commission-split.repository.js');
jest.mock('../services/payment-mock.service.js');
jest.mock('../services/email.service.js');


describe('AppointmentService', () => {
    let appointmentService: AppointmentService;
    let appointmentRepositoryMock: jest.Mocked<AppointmentRepository>;
    let availabilityRepositoryMock: jest.Mocked<AvailabilityRepository>;
    let userRepositoryMock: jest.Mocked<UserRepository>;
    let transactionRepositoryMock: jest.Mocked<TransactionRepository>;
    let commissionSplitRepositoryMock: jest.Mocked<CommissionSplitRepository>;
    let paymentMockServiceMock: jest.Mocked<PaymentMockService>;
    let emailServiceMock: jest.Mocked<ResendEmailService>;

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
            updatePaymentStatus: jest.fn(),
            reschedule: jest.fn()
        } as unknown as jest.Mocked<AppointmentRepository>;

        availabilityRepositoryMock = {
            create: jest.fn(),
            findByProfessionalId: jest.fn(),
            deleteByProfessionalId: jest.fn(),
            isProfessionalAvailable: jest.fn()
        } as unknown as jest.Mocked<AvailabilityRepository>;

        userRepositoryMock = {
            findById: jest.fn()
        } as unknown as jest.Mocked<UserRepository>;

        paymentMockServiceMock = {
            processAppointmentPayment: jest.fn(),
            processRefund: jest.fn()
        } as unknown as jest.Mocked<PaymentMockService>;

        transactionRepositoryMock = {
            create: jest.fn(),
            findByAppointmentId: jest.fn(),
            findByReferenceId: jest.fn()
        } as unknown as jest.Mocked<TransactionRepository>;

        commissionSplitRepositoryMock = {
            create: jest.fn(),
            updateStatusByTransaction: jest.fn()
        } as unknown as jest.Mocked<CommissionSplitRepository>;

        emailServiceMock = {
            send: jest.fn().mockImplementation(async () => { })
        } as unknown as jest.Mocked<ResendEmailService>;

        appointmentService = new AppointmentService(
            appointmentRepositoryMock,
            availabilityRepositoryMock,
            userRepositoryMock,
            transactionRepositoryMock,
            commissionSplitRepositoryMock,
            paymentMockServiceMock,
            emailServiceMock
        );
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

        const mockPatient: User = {
            id: 1,
            name: 'Patient Test',
            email: 'patient@test.com',
            password: 'hash',
            role: 'patient',
            cpf: '12345678900',
            phone: '123456789'
        };

        const mockProfessional: User = {
            id: 2,
            name: 'Dr. Test',
            email: 'doctor@test.com',
            password: 'hash',
            role: 'health_professional',
            cpf: '98765432100',
            phone: '987654321'
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

        beforeEach(() => {
            // Default success mocks
            userRepositoryMock.findById.mockImplementation(async (id) => {
                if (id === 1) return mockPatient;
                if (id === 2) return mockProfessional;
                return null;
            });
        });

        it('should successfully schedule an appointment when time is within availability', async () => {
            // Mock findByProfessionalId to return availability
            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);

            // Mock checkConflict to return false (no conflict)
            appointmentRepositoryMock.checkConflict.mockResolvedValue(false);

            // Mock create to return a new ID
            appointmentRepositoryMock.create.mockResolvedValue(123);

            const result = await appointmentService.scheduleAppointment(validAppointmentData);

            expect(result.id).toBe(123);
            expect(availabilityRepositoryMock.findByProfessionalId).toHaveBeenCalledWith(2);
            expect(appointmentRepositoryMock.create).toHaveBeenCalledWith(validAppointmentData);
        });

        it('should throw NotFoundError when patient does not exist', async () => {
            userRepositoryMock.findById.mockImplementation(async (id) => {
                if (id === 2) return mockProfessional;
                return null; // Patient not found
            });

            await expect(appointmentService.scheduleAppointment(validAppointmentData))
                .rejects
                .toThrow(new NotFoundError("Paciente não encontrado."));
        });

        it('should throw NotFoundError when professional does not exist', async () => {
            userRepositoryMock.findById.mockImplementation(async (id) => {
                if (id === 1) return mockPatient;
                return null; // Professional not found
            });

            await expect(appointmentService.scheduleAppointment(validAppointmentData))
                .rejects
                .toThrow(new NotFoundError("Profissional não encontrado."));
        });

        it('should throw ValidationError when professional is not a health_professional', async () => {
            const fakeProfessional = { ...mockProfessional, role: 'patient' as const };
            userRepositoryMock.findById.mockImplementation(async (id) => {
                if (id === 1) return mockPatient;
                if (id === 2) return fakeProfessional; // Not a pro
                return null;
            });

            await expect(appointmentService.scheduleAppointment(validAppointmentData))
                .rejects
                .toThrow(new ValidationError("O usuário informado não é um profissional de saúde.", "professional"));
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

            expect(result.id).toBe(123);

            jest.useRealTimers();
        });

        // RN-03 Tests
        it('should throw ValidationError when appointment is more than 90 days in the future', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 91);
            const futureDateString = futureDate.toISOString().split('T')[0];

            const farFutureAppointment = { ...validAppointmentData, date: futureDateString };

            // Mock availability to match the future day of week
            // 91 days from "now" implies a different day of week, so we need to be careful with the mock availability
            // Instead of complex date math for the mock, let's just assume the professional works every day for this test specific logic
            // OR, better, calculating the day of week for the mock.

            // Let's use fake timers to control "now" and pick a fixed date for the appointment
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-01-01T12:00:00Z')); // "Now"

            const appointmentDate = '2026-05-01'; // Roughly 120 days later
            const tooFarAppointment = { ...validAppointmentData, date: appointmentDate };

            // Ensure day of week matches the mock availability (Tuesday = 2)
            // 2026-05-05 is a Tuesday.
            const tuesdayFarAway = '2026-05-05';
            // 2026-01-01 to 2026-05-05 is > 120 days

            const farAppointment = { ...validAppointmentData, date: tuesdayFarAway };

            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);

            await expect(appointmentService.scheduleAppointment(farAppointment))
                .rejects
                .toThrow(new ValidationError("Não é possível agendar consultas com mais de 90 dias de antecedência.", "date"));

            jest.useRealTimers();
        });

        it('should allow appointment within 90 days limit', async () => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-01-01T12:00:00Z')); // "Now"

            // 2026-03-31 is a Tuesday, approx 89 days from Jan 1
            const validFutureDate = '2026-03-31';
            const validAppointment = { ...validAppointmentData, date: validFutureDate };

            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);
            appointmentRepositoryMock.checkConflict.mockResolvedValue(false);
            appointmentRepositoryMock.create.mockResolvedValue(456);

            const result = await appointmentService.scheduleAppointment(validAppointment);

            expect(result.id).toBe(456);

            jest.useRealTimers();
        });
        // RN-04 Tests
        it('should throw ValidationError when patient already has an appointment with the same professional on the same day', async () => {
            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailability);
            // Simulate conflict
            appointmentRepositoryMock.checkConflict.mockResolvedValue(true);

            await expect(appointmentService.scheduleAppointment(validAppointmentData))
                .rejects
                .toThrow(new ValidationError("O paciente já possui uma consulta agendada com este profissional nesta data.", "conflict"));
        });

        // RN-05 Tests
        it('should throw ValidationError when appointment time is in the past on the same day', async () => {
            // 2026-05-10 is a Sunday.
            // Appointment at 13:00 local time.
            const sameDay = '2026-05-10';
            const pastTime = '13:00';

            // Set "now" to 15:00 local time on the same day.
            // We use the same string format to ensure consistency with how Service creates the appointment Date.
            const now = new Date(`${sameDay}T15:00:00`);
            jest.useFakeTimers();
            jest.setSystemTime(now);

            // Update mock availability to match Sunday (0) to avoid "not available" error masking the date check failure
            const availabilityForTest = [{
                ...mockAvailability[0],
                day_of_week: 0, // Sunday
                start_time: '08:00',
                end_time: '18:00'
            }];
            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(availabilityForTest);

            const pastAppointment = { ...validAppointmentData, date: sameDay, time: pastTime };

            await expect(appointmentService.scheduleAppointment(pastAppointment))
                .rejects
                .toThrow(new ValidationError("O agendamento deve ser para uma data futura.", "date"));

            jest.useRealTimers();
        });
    });

    describe('cancelAppointment', () => {
        const appointmentId = 123;
        const mockAppointment: Appointment = {
            id: appointmentId,
            patient_id: 1,
            professional_id: 2,
            date: '2026-03-10',
            time: '14:30',
            status: 'scheduled',
            payment_status: 'pending',
            price: 150,
            type: 'presencial'
        };

        beforeEach(() => {
            appointmentRepositoryMock.findById.mockResolvedValue(mockAppointment);
            paymentMockServiceMock.processRefund.mockResolvedValue({ success: true, message: "Refund processed", refundAmount: 150 });
        });

        it('should cancel appointment successfully when pending payment', async () => {
            await appointmentService.cancelAppointment(appointmentId, "Changed mind", 1);

            expect(appointmentRepositoryMock.cancel).toHaveBeenCalledWith(appointmentId, "Changed mind", 1);
            expect(paymentMockServiceMock.processRefund).not.toHaveBeenCalled();
        });

        it('should cancel and process refund when status is paid', async () => {
            const paidAppointment = { ...mockAppointment, payment_status: 'paid' as const };
            appointmentRepositoryMock.findById.mockResolvedValue(paidAppointment);

            const result = await appointmentService.cancelAppointment(appointmentId, "Emergency", 1);

            expect(appointmentRepositoryMock.cancel).toHaveBeenCalled();
            expect(paymentMockServiceMock.processRefund).toHaveBeenCalledWith(appointmentId);
            expect(result.refundDetails).toBeDefined();
        });

        it('should throw ValidationError if already cancelled', async () => {
            const cancelledAppointment = { ...mockAppointment, status: 'cancelled_by_patient' as const };
            appointmentRepositoryMock.findById.mockResolvedValue(cancelledAppointment);

            await expect(appointmentService.cancelAppointment(appointmentId, "Reason", 1))
                .rejects
                .toThrow(new ValidationError("Este agendamento já está cancelado ou concluído.", "status"));
        });
    });

    describe('reschedule - RN-25', () => {
        const appointmentId = 123;
        const mockAppointment: Appointment = {
            id: appointmentId,
            patient_id: 1,
            professional_id: 2,
            date: '2026-03-10',
            time: '14:30',
            status: 'scheduled',
            payment_status: 'paid',
            price: 150,
            type: 'presencial'
        };

        const mockAvailabilityForReschedule = [
            {
                id: 1,
                professional_id: 2,
                day_of_week: 2, // Tuesday
                start_time: '08:00',
                end_time: '18:00'
            }
        ];

        beforeEach(() => {
            appointmentRepositoryMock.findById.mockResolvedValue(mockAppointment);
            availabilityRepositoryMock.findByProfessionalId.mockResolvedValue(mockAvailabilityForReschedule);
            availabilityRepositoryMock.isProfessionalAvailable.mockResolvedValue(true);
            appointmentRepositoryMock.checkConflict.mockResolvedValue(false);
        });

        it('should reschedule without fee when >=24 hours in advance', async () => {
            // Set "now" to be 48 hours before the appointment
            const appointmentDateTime = new Date('2026-03-10T14:30:00');
            const twoDaysBefore = new Date(appointmentDateTime.getTime() - 48 * 60 * 60 * 1000);

            jest.useFakeTimers();
            jest.setSystemTime(twoDaysBefore);

            appointmentRepositoryMock.reschedule.mockResolvedValue();

            const newDate = '2026-03-17'; // Tuesday
            const newTime = '10:00';

            await appointmentService.reschedule({
                requesterId: 1,
                requesterRole: 'patient',
                appointmentId: appointmentId,
                newDate: newDate,
                newTime: newTime
            });

            expect(appointmentRepositoryMock.reschedule).toHaveBeenCalledWith(appointmentId, newDate, newTime);
            // Should NOT create a reschedule fee transaction
            expect(transactionRepositoryMock.create).not.toHaveBeenCalled();

            jest.useRealTimers();
        });

        it('should charge R$30 reschedule fee when <24 hours in advance - RN-25', async () => {
            // Set "now" to be 12 hours before the appointment
            const appointmentDateTime = new Date('2026-03-10T14:30:00');
            const twelveHoursBefore = new Date(appointmentDateTime.getTime() - 12 * 60 * 60 * 1000);

            jest.useFakeTimers();
            jest.setSystemTime(twelveHoursBefore);

            appointmentRepositoryMock.reschedule.mockResolvedValue();
            transactionRepositoryMock.create.mockResolvedValue(999);

            const newDate = '2026-03-17'; // Tuesday
            const newTime = '10:00';

            await appointmentService.reschedule({
                requesterId: 1,
                requesterRole: 'patient',
                appointmentId: appointmentId,
                newDate: newDate,
                newTime: newTime
            });

            // Should reschedule
            expect(appointmentRepositoryMock.reschedule).toHaveBeenCalledWith(appointmentId, newDate, newTime);

            // Should create reschedule fee transaction
            expect(transactionRepositoryMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'reschedule_fee',
                    reference_id: appointmentId,
                    amount_gross: 30,
                    payer_id: 1,
                    status: 'paid',
                })
            );

            jest.useRealTimers();
        });

        it('should throw NotFoundError if appointment does not exist', async () => {
            appointmentRepositoryMock.findById.mockResolvedValue(null);

            await expect(appointmentService.reschedule({
                requesterId: 1,
                requesterRole: 'patient',
                appointmentId: 999,
                newDate: '2026-03-17',
                newTime: '10:00'
            }))
                .rejects
                .toThrow(NotFoundError);
        });
    });

    describe('completeAppointment - RN-27', () => {
        const appointmentId = 123;
        const mockAppointment: Appointment = {
            id: appointmentId,
            patient_id: 1,
            professional_id: 2,
            date: '2026-03-10',
            time: '14:30',
            status: 'in_progress',
            payment_status: 'paid',
            price: 150,
            type: 'presencial'
        };

        beforeEach(() => {
            appointmentRepositoryMock.findById.mockResolvedValue(mockAppointment);
            appointmentRepositoryMock.updateStatus.mockResolvedValue();
        });

        it('should complete appointment and activate commissions - RN-27', async () => {
            const mockTransactions = [
                {
                    id: 456,
                    type: 'appointment_payment' as const,
                    reference_id: appointmentId,
                    reference_type: 'appointment' as const,
                    status: 'paid' as const,
                    amount_gross: 150,
                    payer_id: 1,
                    mdr_fee: 4.5,
                    amount_net: 145.5,
                }
            ];
            transactionRepositoryMock.findByReferenceId.mockResolvedValue(mockTransactions);
            commissionSplitRepositoryMock.updateStatusByTransaction.mockResolvedValue(undefined);

            await appointmentService.completeAppointment(appointmentId, { id: 2, role: 'health_professional' });

            expect(appointmentRepositoryMock.updateStatus).toHaveBeenCalledWith(appointmentId, 'completed');
            expect(commissionSplitRepositoryMock.updateStatusByTransaction).toHaveBeenCalledWith(
                456,
                'pending_completion',
                'pending'
            );
        });

        it('should throw ForbiddenError if not the assigned professional', async () => {
            // Different professional trying to complete
            await expect(appointmentService.completeAppointment(appointmentId, { id: 999, role: 'health_professional' }))
                .rejects
                .toThrow('Only the assigned professional can complete this appointment');
        });

        it('should throw ValidationError if payment is not confirmed', async () => {
            const unpaidAppointment = { ...mockAppointment, payment_status: 'pending' as const };
            appointmentRepositoryMock.findById.mockResolvedValue(unpaidAppointment);

            await expect(appointmentService.completeAppointment(appointmentId, { id: 2, role: 'health_professional' }))
                .rejects
                .toThrow('Cannot complete: appointment payment not confirmed');
        });

        it('should throw NotFoundError if appointment does not exist', async () => {
            appointmentRepositoryMock.findById.mockResolvedValue(null);

            await expect(appointmentService.completeAppointment(999, { id: 2, role: 'health_professional' }))
                .rejects
                .toThrow(NotFoundError);
        });
    });
});
