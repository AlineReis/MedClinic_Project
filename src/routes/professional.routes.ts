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
const professionalService = new ProfessionalService(usersRepository, professionalRepository, availabilityRepository);
const professionalController = new ProfessionalController(professionalService);


router.post('/', professionalController.register);
router.get('/:specialty', professionalController.listBySpecialty);

export { router as professionalRoutes };
