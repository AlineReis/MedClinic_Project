import { Router } from "express";
import { ProfessionalController } from "../controller/professional.controller.js";

const router = Router();

router.post('/', ProfessionalController.register);
router.get('/:specialty', ProfessionalController.listBySpecialty);

export { router as professionalRoutes };
