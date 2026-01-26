import { Router } from "express";
import { PrescriptionController } from "../controller/prescription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const prescriptionRoutes = Router();

prescriptionRoutes.use(authMiddleware);

prescriptionRoutes.post("/", PrescriptionController.create);
prescriptionRoutes.get("/", PrescriptionController.list);
prescriptionRoutes.get("/:id", PrescriptionController.getById);

export { prescriptionRoutes };
