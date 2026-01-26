import { AvailabilityRepository } from "@repositories/availability.repository.js";
import { ProfessionalRepository } from "@repositories/professional.repository.js";
import { UserRepository } from "@repositories/user.repository.js";
import { ProfessionalService } from "@services/professional.service.js";
import { Router } from "express";
import { ProfessionalController } from "../controller/professional.controller.js";

const router = Router();



const usersRepository = new UserRepository();
const availabilityRepository = new AvailabilityRepository();
const professionalRepository = new ProfessionalRepository();
// Need Appointment Repository now
import { AppointmentRepository } from "@repositories/appointment.repository.js";
const appointmentRepository = new AppointmentRepository();

const professionalService = new ProfessionalService(usersRepository, professionalRepository, availabilityRepository, appointmentRepository);
const professionalController = new ProfessionalController(professionalService);


router.post('/', professionalController.register);
// Rota de listagem com filtros (query params: ?specialty=x&name=y&page=1)
router.get('/', professionalController.list);
router.get('/:id/availability', professionalController.getAvailability);

export { router as professionalRoutes };
