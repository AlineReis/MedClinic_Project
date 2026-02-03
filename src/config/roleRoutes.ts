import type { UserRole } from "types/auth";
const getBasePath = () => {
  const path = window.location.pathname;
  return path.startsWith('/server03/') ? '/server03' : '';
};

const BASE = getBasePath();

export const roleRoutes: Record<UserRole, string> = {
  patient: `${BASE}/pages/patient-dashboard.html`,
  receptionist: `${BASE}/pages/reception-dashboard.html`,
  lab_tech: `${BASE}/pages/lab-dashboard.html`,
  health_professional: `${BASE}/pages/doctor-dashboard.html`,
  clinic_admin: `${BASE}/pages/manager-dashboard.html`,
  system_admin: `${BASE}/pages/admin-dashboard.html`,
};
