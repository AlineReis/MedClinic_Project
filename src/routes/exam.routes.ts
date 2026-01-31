import { AppointmentRepository } from "@repositories/appointment.repository.js";
import { ExamRepository } from "@repositories/exam.repository.js";
import { ExamService } from "@services/exam.service.js";
import { Router } from "express";
import multer from "multer";
import path from "path";
import { ExamController } from "../controller/exam.controller.js";

const examRoutes = Router();

// Auth and clinic context middlewares are applied globally in routes/index.ts

// Configurar multer para upload de arquivos (Issue #506)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/exam-results/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `exam-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF são permitidos."));
    }
  },
});

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

// Issue #506: Novas rotas
examRoutes.post(
  "/:id/upload-result",
  upload.single("file"),
  examController.uploadResult,
);
examRoutes.post("/:id/release-result", examController.releaseResult);

export { examRoutes };
