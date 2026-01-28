import type { Request, Response, NextFunction } from "express";
import { AppointmentService } from "../services/appointment.service.js";
import { Appointment, AppointmentFilters, PaginationParams } from "../models/appointment.js";
import { ValidationError, ForbiddenError } from "../utils/errors.js";

export class AppointmentController {
    constructor(private appointmentService: AppointmentService) { }

    // POST /appointments
    public schedule = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { cardDetails, ...data } = req.body;

            // Segurança: Garantir que o patient_id seja do usuário logado se for um paciente
            if (req.user?.role === 'patient') {
                if (data.patient_id !== req.user.id) {
                    throw new ForbiddenError("Você não pode agendar para outro paciente.");
                }
            }

            const result = await this.appointmentService.scheduleAppointment(data as Appointment, cardDetails);

            res.status(201).json({
                success: true,
                message: result.message || "Consulta agendada com sucesso.",
                id: result.id,
                payment_status: result.payment_status,
                invoice: result.invoice
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /appointments
     * Unified endpoint for listing appointments with filters, pagination and RBAC
     */
    public list = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user!; // Middleware de auth garante user

            // Extrair Filters
            const filters: AppointmentFilters = {
                status: req.query.status as string,
                date: req.query.date as string,
                upcoming: req.query.upcoming === 'true',
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string
            };

            // Parse numeric IDs if provided, validation handled by Service RBAC
            if (req.query.patient_id) filters.patient_id = Number(req.query.patient_id);
            if (req.query.professional_id) filters.professional_id = Number(req.query.professional_id);

            // Extrair Pagination
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 10;
            const pagination: PaginationParams = { page, pageSize };

            const result = await this.appointmentService.listAppointments(filters, pagination, user);

            res.status(200).json({
                success: true,
                ...result
            });

        } catch (error) {
            next(error);
        }
    };

    // GET /appointments/:id
    public getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const appointment = await this.appointmentService.getAppointmentById(id);

            // Segurança
            if (req.user?.role === 'patient' && appointment.patient_id !== req.user.id) {
                throw new ForbiddenError("Acesso negado.");
            }
            if (req.user?.role === 'health_professional' && appointment.professional_id !== req.user.id) {
                throw new ForbiddenError("Acesso negado.");
            }

            res.status(200).json({
                success: true,
                appointment
            });
        } catch (error) {
            next(error);
        }
    };

    // PATCH /appointments/:id/confirm
    public confirm = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);

            // Apenas profissionais e recepção podem confirmar? Regra negocial a conferir, assumindo que sim.
            if (req.user?.role === 'patient') {
                throw new ForbiddenError("Pacientes não podem confirmar consultas manualmente.");
            }

            await this.appointmentService.confirmAppointment(id);

            res.status(200).json({
                success: true,
                message: "Consulta confirmada com sucesso."
            });
        } catch (error) {
            next(error);
        }
    };

    // POST /appointments/:id/cancel
    public cancel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const { reason } = req.body;

            if (!reason) {
                throw new ValidationError("Motivo do cancelamento é obrigatório.");
            }

            // Validar permissão
            const appointment = await this.appointmentService.getAppointmentById(id);
            if (req.user?.role === 'patient' && appointment.patient_id !== req.user.id) {
                throw new ForbiddenError("Você só pode cancelar seus próprios agendamentos.");
            }

            const result = await this.appointmentService.cancelAppointment(id, reason, req.user!.id);

            res.status(200).json({
                success: true,
                message: result.message,
                refund: result.refundDetails
            });
        } catch (error) {
            next(error);
        }
    };
}
