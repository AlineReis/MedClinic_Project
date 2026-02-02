import type { UserRole } from "types/auth";

export const roleRoutes: Record<UserRole, string> = {
  patient: "/pages/patient-dashboard.html",
  receptionist: "/pages/reception-dashboard.html",
  lab_tech: "/pages/exams.html",
  health_professional: "/pages/doctor-dashboard.html",
  clinic_admin: "/pages/manager-dashboard.html",
  system_admin: "/pages/admin-dashboard.html",
};
