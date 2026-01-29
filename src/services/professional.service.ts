import { CommissionStatus } from "@models/commission.js";
import type {
  CommissionRecord,
  CommissionRepository,
  CommissionSummary,
} from "@repositories/commission.repository.js";
import type { IUserRepository } from "@repositories/iuser.repository.js";
import bcrypt from "bcrypt";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "utils/errors.js";
import {
  Availability,
  ProfessionalDetails,
} from "../models/professional.model.js";
import { User, type UserRole } from "../models/user.js";
import { AppointmentRepository } from "../repository/appointment.repository.js"; // Reverted to relative
import { AvailabilityRepository } from "../repository/availability.repository.js";
import { ProfessionalRepository } from "../repository/professional.repository.js";
import { MonthlyReportRepository } from "../repository/monthly-report.repository.js";
import type { MonthlyReport, MonthlyReportFilters } from "../models/monthly-report.js";
import * as Validators from "../utils/validators.js";

const SLOT_DURATION_MINUTES = 50;

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export type ListCommissionsInput = {
  requesterId: number;
  requesterRole: UserRole;
  professionalId: number;
  month?: number;
  year?: number;
  status?: CommissionStatus;
};

// Helper para somar minutos no formato HH:MM
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export class ProfessionalService {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly professionalRepository: ProfessionalRepository,
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly commissionRepository: CommissionRepository,
    private readonly monthlyReportRepository: MonthlyReportRepository,
  ) { }

  async register(
    userData: User,
    detailsData: ProfessionalDetails,
    availabilities: Availability[] = [],
  ): Promise<any> {
    if (userData.cpf && !Validators.isValidCpfLogic(userData.cpf)) {
      throw new Error("Invalid CPF");
    }
    if (!detailsData.registration_number) {
      throw new Error("Registration number (CRM/CRP) is required");
    }

    const existing = await this.usersRepository.findByEmail(userData.email);
    if (existing) throw new Error("Email already in use");

    const defaultPassword =
      process.env.DEFAULT_PROFESSIONAL_PASSWORD || "Mudar123";
    const hashedPassword = await bcrypt.hash(
      userData.password || defaultPassword,
      10,
    );

    let userId: number | null = null;

    try {
      userId = await this.usersRepository.createHealthProfessional({
        ...userData,
        password: hashedPassword,
      });

      await this.professionalRepository.create({
        ...detailsData,
        user_id: userId,
      });

      for (const slot of availabilities) {
        await this.availabilityRepository.create({
          ...slot,
          professional_id: userId,
        });
      }

      return { userId, message: "Professional registered successfully" };
    } catch (error) {
      console.error("Registration failed, rolling back...", error);
      if (userId) {
        await this.usersRepository.delete(userId);
      }
      throw error;
    }
  }

  async getAvailability(professionalId: number, daysAhead: number = 7) {
    const schedule =
      await this.availabilityRepository.findByProfessionalId(professionalId);

    if (!schedule || schedule.length === 0) {
      return [];
    }

    const availableSlots: {
      date: string;
      time: string;
      is_available: boolean;
    }[] = [];
    const today = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const dayOfWeek = currentDate.getDay(); // 0=Dom, 1=Seg...
      const dateStr = formatDate(currentDate);

      const dailyRules = schedule.filter(s => s.day_of_week === dayOfWeek);

      for (const rule of dailyRules) {
        let currentTime = rule.start_time;
        const endTime = rule.end_time;

        while (currentTime < endTime) {
          const slotEnd = addMinutes(currentTime, SLOT_DURATION_MINUTES);

          if (slotEnd > endTime) break;

          availableSlots.push({
            date: dateStr,
            time: currentTime,
            is_available: true,
          });

          currentTime = slotEnd;
        }
      }
    }

    const startDate = formatDate(today);
    const endDateDate = new Date(today);
    endDateDate.setDate(today.getDate() + daysAhead);
    const endDate = formatDate(endDateDate);

    const appointments = await this.appointmentRepository.findAll(
      { professional_id: professionalId, startDate, endDate },
      { page: 1, pageSize: 1000 },
    );

    for (const slot of availableSlots) {
      const isTaken = appointments.data.some(
        appt =>
          appt.date === slot.date &&
          appt.time === slot.time &&
          appt.status !== "cancelled_by_patient" &&
          appt.status !== "cancelled_by_clinic",
      );

      if (isTaken) {
        slot.is_available = false;
      }
    }

    return availableSlots.filter(s => s.is_available);
  }

  async createAvailability(
    professionalId: number,
    slots: {
      day_of_week: number;
      start_time: string;
      end_time: string;
    }[],
  ): Promise<Availability[]> {
    const allRules =
      await this.availabilityRepository.findByProfessionalId(professionalId);
    const createdSlots: Availability[] = [];

    for (const [index, slot] of slots.entries()) {
      if (slot.start_time >= slot.end_time) {
        throw new Error(`Item ${index}: Start time must be before end time`);
      }

      const internalOverlap = slots.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          slot.day_of_week === other.day_of_week &&
          slot.start_time < other.end_time &&
          slot.end_time > other.start_time,
      );

      if (internalOverlap) {
        throw new Error(
          `Item ${index}: Overlaps with another item in the request`,
        );
      }

      const dayRules = allRules.filter(r => r.day_of_week === slot.day_of_week);
      for (const rule of dayRules) {
        if (
          slot.start_time < rule.end_time &&
          slot.end_time > rule.start_time
        ) {
          throw new Error(
            `Item ${index}: Overlaps with existing rule: ${rule.start_time} - ${rule.end_time}`,
          );
        }
      }
    }

    for (const slot of slots) {
      const id = await this.availabilityRepository.create({
        ...slot,
        professional_id: professionalId,
      });

      createdSlots.push({
        id,
        professional_id: professionalId,
        ...slot,
        is_active: 1,
      });
    }

    return createdSlots;
  }

  async listProfessionals(
    filters: { specialty?: string; name?: string },
    page: number = 1,
    pageSize: number = 10,
  ) {
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    return await this.professionalRepository.list(filters, limit, offset);
  }

  public async listCommissions(
    input: ListCommissionsInput,
  ): Promise<{ summary: CommissionSummary; details: CommissionRecord[] }> {
    const { requesterId, requesterRole, professionalId, month, year, status } =
      input;

    const exists =
      await this.professionalRepository.isProfessional(professionalId);
    if (!exists) {
      throw new NotFoundError("Profissional não encontrado");
    }

    if (
      requesterRole === "health_professional" &&
      requesterId !== professionalId
    ) {
      throw new ForbiddenError("Você só pode ver suas próprias comissões");
    }
    if (
      requesterRole !== "health_professional" &&
      requesterRole !== "clinic_admin" &&
      requesterRole !== "system_admin"
    ) {
      throw new ForbiddenError("Você não tem permissão para acessar comissões");
    }

    const details = await this.commissionRepository.listByProfessional(
      professionalId,
      month,
      year,
      status,
    );

    const summary = this.calculateSummary(details);

    return { summary, details };
  }

  private calculateSummary(details: CommissionRecord[]): CommissionSummary {
    return details.reduce<CommissionSummary>(
      (acc, item) => {
        const amount = item.amount;

        if (item.status === CommissionStatus.PAID) {
          acc.paid += amount;
        } else if (
          item.status === CommissionStatus.PENDING ||
          item.status === CommissionStatus.PROCESSING
        ) {
          acc.pending += amount;
        }

        // Normalização de precisão decimal (Prevenção de 0.30000000000000004)
        acc.paid = Number(acc.paid.toFixed(2));
        acc.pending = Number(acc.pending.toFixed(2));
        acc.total = Number((acc.paid + acc.pending).toFixed(2));

        return acc;
      },
      { pending: 0, paid: 0, total: 0 },
    );
  }

  /**
   * Get monthly reports for a professional with RBAC
   * RN-28: Professionals can view ONLY their own reports, admins can view any
   */
  async getMonthlyReports(
    professionalId: number,
    requester: { id: number; role: UserRole; clinic_id?: number | null },
    filters?: MonthlyReportFilters,
  ): Promise<MonthlyReport[]> {
    // Verify professional exists
    const professional = await this.usersRepository.findById(professionalId);
    if (!professional || professional.role !== "health_professional") {
      throw new NotFoundError("Professional not found");
    }

    // RBAC: Professional can only view own reports
    if (requester.role === "health_professional") {
      if (requester.id !== professionalId) {
        throw new ForbiddenError("You can only view your own reports");
      }
    } else if (requester.role === "clinic_admin") {
      // Clinic admin can only view reports from their clinic
      if (professional.clinic_id !== requester.clinic_id) {
        throw new ForbiddenError("You can only view reports from your clinic");
      }
    } else if (requester.role !== "system_admin") {
      // Other roles cannot access reports
      throw new ForbiddenError("You do not have permission to view reports");
    }

    return await this.monthlyReportRepository.findByProfessional(
      professionalId,
      filters,
    );
  }

  /**
   * Generate monthly report for a professional (admin only)
   * RN-28: Reports generated on 1st of each month
   */
  async generateMonthlyReport(
    professionalId: number,
    month: number,
    year: number,
    requester: { role: UserRole; clinic_id?: number | null },
  ): Promise<MonthlyReport> {
    // Only admins can generate reports
    if (
      requester.role !== "clinic_admin" &&
      requester.role !== "system_admin"
    ) {
      throw new ForbiddenError("Only admins can generate reports");
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      throw new ValidationError("Month must be between 1 and 12");
    }
    if (year < 2024) {
      throw new ValidationError("Year must be 2024 or later");
    }

    // Verify professional exists
    const professional = await this.usersRepository.findById(professionalId);
    if (!professional || professional.role !== "health_professional") {
      throw new NotFoundError("Professional not found");
    }

    // Clinic admin can only generate for professionals in their clinic
    if (requester.role === "clinic_admin") {
      if (professional.clinic_id !== requester.clinic_id) {
        throw new ForbiddenError(
          "You can only generate reports for professionals in your clinic",
        );
      }
    }

    try {
      const reportId = await this.monthlyReportRepository.generateReport(
        professionalId,
        month,
        year,
      );

      const report = await this.monthlyReportRepository.findById(reportId);
      if (!report) {
        throw new Error("Failed to retrieve generated report");
      }

      return report;
    } catch (error: any) {
      // Handle UNIQUE constraint violation (duplicate report)
      if (error.message?.includes("UNIQUE constraint failed")) {
        throw new ConflictError(
          `Report for ${year}-${month.toString().padStart(2, "0")} already exists`,
        );
      }
      throw error;
    }
  }

  /**
   * Mark a monthly report as paid (admin only)
   */
  async markReportAsPaid(
    reportId: number,
    requester: { role: UserRole; clinic_id?: number | null },
    paymentDate?: string,
  ): Promise<MonthlyReport> {
    // Only admins can mark reports as paid
    if (
      requester.role !== "clinic_admin" &&
      requester.role !== "system_admin"
    ) {
      throw new ForbiddenError("Only admins can mark reports as paid");
    }

    const report = await this.monthlyReportRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError("Report not found");
    }

    // Verify professional belongs to admin's clinic
    if (requester.role === "clinic_admin") {
      const professional = await this.usersRepository.findById(
        report.professional_id,
      );
      if (professional?.clinic_id !== requester.clinic_id) {
        throw new ForbiddenError(
          "You can only manage reports for your clinic",
        );
      }
    }

    const paidDate = paymentDate || new Date().toISOString().split("T")[0];
    await this.monthlyReportRepository.markAsPaid(reportId, paidDate);

    const updatedReport = await this.monthlyReportRepository.findById(reportId);
    if (!updatedReport) {
      throw new Error("Failed to retrieve updated report");
    }

    return updatedReport;
  }
}
