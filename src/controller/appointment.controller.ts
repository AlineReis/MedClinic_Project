import type { Request, Response, NextFunction } from "express";
import { AppointmentService } from "../services/appointment.service.js";
import { Appointment } from "../models/appointment.js";
import { ValidationError, ForbiddenError } from "../utils/errors.js";

export class AppointmentController {
    constructor(private appointmentService: AppointmentService) { }

    // POST /appointments
    public schedule = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data: Appointment = req.body;

            // Segurança: Garantir que o patient_id seja do usuário logado se for um paciente
            if (req.user?.role === 'patient') {
                if (data.patient_id !== req.user.id) {
                    throw new ForbiddenError("Você não pode agendar para outro paciente.");
                }
            }

            const appointmentId = await this.appointmentService.scheduleAppointment(data);

            res.status(201).json({
                success: true,
                message: "Consulta agendada com sucesso.",
                id: appointmentId
            });
        } catch (error) {
            next(error);
        }
    };

    // GET /appointments/patient/:id
    public listPatientAppointments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const patientId = Number(req.params.id);

            // Segurança: Paciente só vê seus agendamentos
            if (req.user?.role === 'patient' && req.user.id !== patientId) {
                throw new ForbiddenError("Acesso negado.");
            }

            const appointments = await this.appointmentService.getPatientAppointments(patientId);

            res.status(200).json({
                success: true,
                appointments
            });
        } catch (error) {
            next(error);
        }
    };

    // GET /appointments/professional/:id
    public listProfessionalAgenda = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const professionalId = Number(req.params.id);
            const date = req.query.date as string | undefined;

            // Segurança: Profissional só vê sua própria agenda (ou admin/recepção)
            if (req.user?.role === 'health_professional' && req.user.id !== professionalId) {
                throw new ForbiddenError("Acesso negado.");
            }

            const appointments = await this.appointmentService.getProfessionalAgenda(professionalId, date);

            res.status(200).json({
                success: true,
                appointments
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

            await this.appointmentService.cancelAppointment(id, reason, req.user!.id);

            res.status(200).json({
                success: true,
                message: "Consulta cancelada com sucesso."
            });
        } catch (error) {
            next(error);
        }
    };
}
