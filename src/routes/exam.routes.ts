import { AppointmentRepository } from "@repositories/appointment.repository.js";
import { ExamRepository } from "@repositories/exam.repository.js";
import { ExamService } from "@services/exam.service.js";
import { Router } from "express";
import { ExamController } from "../controller/exam.controller.js";

const examRoutes = Router({ mergeParams: true });

// Auth and clinic context middlewares are applied globally in routes/index.ts

const examRepository = new ExamRepository();
const appointmentRepository = new AppointmentRepository();
const examService = new ExamService(examRepository, appointmentRepository);
const examController = new ExamController(examService);

examRoutes.get("/catalog", examController.listCatalog);
examRoutes.post("/", examController.createRequest);
examRoutes.get("/", examController.listRequests);
examRoutes.get("/:id", examController.getRequest);

// Phase 5: Exam advanced features
examRoutes.post("/:id/schedule", examController.schedule);
examRoutes.get("/:id/download", examController.download);

export { examRoutes };
