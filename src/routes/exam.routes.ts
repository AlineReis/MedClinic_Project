import { AppointmentRepository } from "../repository/appointment.repository.js";
import { ExamRepository } from "../repository/exam.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { ExamService } from "../services/exam.service.js";
import { Router } from "express";
import { ExamController } from "../controller/exam.controller.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";

const examRoutes = Router();

examRoutes.use(authMiddleware);

const examRepository = new ExamRepository();
const appointmentRepository = new AppointmentRepository();
const userRepository = new UserRepository();
const examService = new ExamService(examRepository, appointmentRepository, userRepository);
const examController = new ExamController(examService);

examRoutes.get("/catalog", examController.listCatalog);
examRoutes.post("/", examController.createRequest);
examRoutes.get("/", examController.listRequests);
examRoutes.get("/:id", examController.getRequest);

// RN-14 & RN-15: Release exam result (lab_tech or admin only)
examRoutes.post(
  "/:id/release",
  roleMiddleware(["lab_tech", "clinic_admin", "system_admin"]),
  examController.releaseResult,
);

export { examRoutes };
