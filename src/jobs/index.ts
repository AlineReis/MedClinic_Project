import { startAppointmentReminderJob } from "./appointmentReminders.js";
import { startExamExpirationJob } from "./examExpiration.js";

/**
 * Initialize all scheduled jobs
 * Can be disabled via ENABLE_JOBS environment variable
 */
export function startAllJobs() {
  console.log("🕐 Starting scheduled jobs...");
  startAppointmentReminderJob();
  startExamExpirationJob();
  console.log("✅ All jobs scheduled successfully");
}
