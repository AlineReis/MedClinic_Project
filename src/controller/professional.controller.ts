import { CommissionStatus } from "../models/commission.js";
import type { UserRole } from "../models/user.js";
import { Request, Response, type NextFunction } from "express";
import { ProfessionalService } from "../services/professional.service.js";

export class ProfessionalController {
  constructor(private professionalService: ProfessionalService) { }

  public register = async (req: Request, res: Response) => {
    try {
      const { user, details, availability } = req.body;

      if (!user || !details) {
        return res.status(400).json({ error: "Missing user or details data" });
      }

      user.role = "health_professional";

      const result = await this.professionalService.register(
        user,
        details,
        availability || [],
      );

      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      const status = error.message.includes("Invalid") ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  };

  public list = async (req: Request, res: Response) => {
    try {
      const { specialty, name, page, pageSize } = req.query;

      const filters = {
        specialty: specialty ? String(specialty) : undefined,
        name: name ? String(name) : undefined,
      };

      // Ensure safe integers
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const sizeNum = Math.max(1, parseInt(pageSize as string) || 10);

      const list = await this.professionalService.listProfessionals(
        filters,
        pageNum,
        sizeNum,
      );
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public getAvailability = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { days_ahead } = req.query;

      const professionalId = Number(id);
      const daysAhead = Math.min(
        90,
        Math.max(1, parseInt(days_ahead as string) || 7),
      );

      if (!professionalId || isNaN(professionalId)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const availability = await this.professionalService.getAvailability(
        professionalId,
        daysAhead,
      );
      res.json(availability);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public createAvailability = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { availabilities } = req.body;

      const professionalId = Number(id);
      if (!professionalId || isNaN(professionalId)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      if (
        !availabilities ||
        !Array.isArray(availabilities) ||
        availabilities.length === 0
      ) {
        return res.status(400).json({
          error:
            "Missing required field: availabilities (must be a non-empty array)",
        });
      }

      for (const [i, slot] of availabilities.entries()) {
        if (
          slot.day_of_week === undefined ||
          !slot.start_time ||
          !slot.end_time
        ) {
          return res.status(400).json({
            error: `Item ${i}: Missing required fields: day_of_week, start_time, end_time`,
          });
        }
      }

      const result = await this.professionalService.createAvailability(
        professionalId,
        availabilities,
      );

      res.status(201).json(result);
    } catch (error: any) {
      const status =
        error.message.includes("Invalid") || error.message.includes("required")
          ? 400
          : error.message.includes("Overlaps")
            ? 409
            : 500;
      res.status(status).json({ error: error.message });
    }
  };
  public listCommissions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const professionalId = Number(req.params.id);
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const statusQuery = req.query.status as string;
      const isValidStatus = Object.values(CommissionStatus).includes(
        statusQuery as any,
      );
      const status = isValidStatus
        ? (statusQuery as CommissionStatus)
        : undefined;

      const result = await this.professionalService.listCommissions({
        requesterId: req.user?.id ?? 0,
        requesterRole: (req.user?.role as UserRole) ?? "patient",
        professionalId,
        month,
        year,
        status,
      });

      return res.status(200).json({
        success: true,
        professional: {
          id: professionalId,
        },
        summary: result.summary,
        details: result.details,
      });
    } catch (error) {
      return next(error);
    }
  };
}
