import { startAppointmentReminderJob } from "./appointmentReminders.js";
import { startExamExpirationJob } from "./examExpiration.js";
import { startMonthlyReportGeneratorJob } from "./monthlyReportGenerator.js";

/**
 * Initialize all scheduled jobs
 * Can be disabled via ENABLE_JOBS environment variable
 */
export function startAllJobs() {
  console.log("🕐 Starting scheduled jobs...");
  startAppointmentReminderJob();
  startExamExpirationJob();
  startMonthlyReportGeneratorJob();
  console.log("✅ All jobs scheduled successfully");
}
