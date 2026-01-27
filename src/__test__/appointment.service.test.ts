import { jest } from '@jest/globals';
import type {
	Appointment,
	RescheduleAppointmentInput,
} from '../models/appointment.js';
import type { AppointmentService } from '../services/appointment.service.js';
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from '../utils/errors.js';

process.env.JWT_SECRET = 'test-secret';
process.env.RESCHEDULE_FREE_WINDOW_HOURS = '24';

const mockFindById = jest.fn() as jest.MockedFunction<(
	appointmentId: number,
	) => Promise<Appointment | null>>;
const mockReschedule = jest.fn() as jest.MockedFunction<(
	appointmentId: number,
	date: string,
	time: string,
	) => Promise<void>>;
const mockIsProfessionalAvailable = jest.fn() as jest.MockedFunction<(
	professionalId: number,
	date: string,
	time: string,
	) => Promise<boolean>>;

const mockIsValidDate = jest.fn() as jest.MockedFunction<(date: string) => boolean>;
const mockIsValidTime = jest.fn() as jest.MockedFunction<(time: string) => boolean>;
const mockIsMinimumHoursInFuture = jest.fn() as jest.MockedFunction<(
	appointmentDate: Date,
	minHours: number,
	) => boolean>;
const mockIsWithinDayRange = jest.fn() as jest.MockedFunction<(date: string, maxDays: number) => boolean>;
const mockIsWithinMinimumHours = jest.fn() as jest.MockedFunction<(
	date: string,
	time: string,
	minHours: number,
	) => boolean>;

jest.unstable_mockModule('../repository/appointment.repository.js', () => ({
  AppointmentRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    reschedule: mockReschedule,
  })),
}));

jest.unstable_mockModule('../repository/availability.repository.js', () => ({
  AvailabilityRepository: jest.fn().mockImplementation(() => ({
    isProfessionalAvailable: mockIsProfessionalAvailable,
  })),
}));

jest.unstable_mockModule('../utils/validators.js', () => ({
  isValidDate: mockIsValidDate,
  isValidTime: mockIsValidTime,
  isMinimumHoursInFuture: mockIsMinimumHoursInFuture,
  isWithinDayRange: mockIsWithinDayRange,
  isWithinMinimumHours: mockIsWithinMinimumHours,
}));

let AppointmentServiceClass: typeof import('../services/appointment.service.js');
let service: AppointmentService;

const appointmentBase: Appointment = {
  id: 12,
  patient_id: 1,
  professional_id: 2,
  date: '2026-02-15',
  time: '09:00',
  type: 'presencial',
  price: 150,
  payment_status: 'pending',
  status: 'scheduled',
};

const validInput: RescheduleAppointmentInput = {
  requesterId: 1,
  requesterRole: 'patient',
  appointmentId: 12,
  newDate: '2026-02-20',
  newTime: '11:00',
};

const setupServiceInstances = async () => {
  const appointmentRepo = await import('../repository/appointment.repository.js');
  const availabilityRepo = await import('../repository/availability.repository.js');

  service = new AppointmentServiceClass.AppointmentService(
    new appointmentRepo.AppointmentRepository(),
    new availabilityRepo.AvailabilityRepository(),
  );
};

const resetMocks = () => {
  jest.clearAllMocks();
  mockIsValidDate.mockReturnValue(true);
  mockIsValidTime.mockReturnValue(true);
  mockIsWithinDayRange.mockReturnValue(true);
  mockIsWithinMinimumHours.mockReturnValue(true);
  mockIsMinimumHoursInFuture.mockImplementation(() => true);
  mockIsProfessionalAvailable.mockResolvedValue(true);
  mockFindById.mockResolvedValue(appointmentBase);
  mockReschedule.mockResolvedValue();
};

describe('AppointmentService - reschedule', () => {
  beforeAll(async () => {
    AppointmentServiceClass = await import('../services/appointment.service.js');
  });

  beforeEach(async () => {
    resetMocks();
    await setupServiceInstances();
  });

  it('should throw NotFoundError when appointment does not exist', async () => {
    mockFindById.mockResolvedValueOnce(null);

    await expect(service.reschedule(validInput)).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when patient tries to use another patient appointment', async () => {
    mockFindById.mockResolvedValueOnce({ ...appointmentBase, patient_id: 999 });

    await expect(service.reschedule(validInput)).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when health professional requests reschedule', async () => {
    await expect(
      service.reschedule({ ...validInput, requesterRole: 'health_professional' }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw ValidationError when date or time is invalid', async () => {
    mockIsValidDate.mockReturnValueOnce(false);

    await expect(service.reschedule(validInput)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when new date is in the past', async () => {
    mockIsMinimumHoursInFuture.mockImplementationOnce(() => false);

    await expect(service.reschedule(validInput)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when date exceeds 90 days window', async () => {
    mockIsWithinDayRange.mockReturnValueOnce(false);

    await expect(service.reschedule(validInput)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when minimum hours for type requirement is not met', async () => {
    mockIsWithinMinimumHours.mockReturnValueOnce(false);

    await expect(service.reschedule(validInput)).rejects.toThrow(ValidationError);
  });

  it('should throw ConflictError when professional is not available', async () => {
    mockIsProfessionalAvailable.mockResolvedValueOnce(false);

    await expect(service.reschedule(validInput)).rejects.toThrow(ConflictError);
  });

  it('should return updated appointment when successful reschedule', async () => {
    const result = await service.reschedule(validInput);

    expect(mockReschedule).toHaveBeenCalledWith(
      validInput.appointmentId,
      validInput.newDate,
      validInput.newTime,
    );
    expect(result).toMatchObject({
      ...appointmentBase,
      date: validInput.newDate,
      time: validInput.newTime,
    });
  });

  it('should still reschedule when free window has passed', async () => {
    mockIsMinimumHoursInFuture.mockImplementationOnce(() => true).mockImplementationOnce(() => false);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(service.reschedule(validInput)).resolves.toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cobrança de taxa'));

    consoleSpy.mockRestore();
  });
});
