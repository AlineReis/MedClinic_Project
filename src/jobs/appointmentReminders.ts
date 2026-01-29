import cron from "node-cron";
import { database } from "../config/database.js";
import { ResendEmailService } from "../services/email.service.js";
import { getAppointmentReminderHtml } from "../utils/email-templates.js";

/**
 * RN-07: Automatic Email Reminders
 * Send 24-hour appointment reminders to patients
 * Runs daily at 9:00 AM
 */
export function startAppointmentReminderJob() {
  // Run daily at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Running appointment reminder job...");

    try {
      // Get appointments for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split("T")[0];

      // Find all appointments scheduled for tomorrow that haven't been reminded yet
      const appointments = await database.query<{
        id: number;
        patient_name: string;
        patient_email: string;
        professional_name: string;
        date: string;
        time: string;
        type: string;
      }>(
        `
        SELECT
          a.id,
          a.date,
          a.time,
          a.type,
          u_patient.name as patient_name,
          u_patient.email as patient_email,
          u_prof.name as professional_name
        FROM appointments a
        JOIN users u_patient ON a.patient_id = u_patient.id
        JOIN users u_prof ON a.professional_id = u_prof.id
        WHERE DATE(a.date) = ?
          AND a.status IN ('scheduled', 'confirmed')
          AND a.reminded_at IS NULL
        ORDER BY a.time
      `,
        [tomorrowDate],
      );

      if (appointments.length === 0) {
        console.log("[CRON] No appointments to remind for tomorrow");
        return;
      }

      console.log(
        `[CRON] Found ${appointments.length} appointment(s) to remind`,
      );

      // Send reminders
      const emailService = new ResendEmailService();
      let successCount = 0;
      let failCount = 0;

      for (const appt of appointments) {
        try {
          // Check if email sending is enabled
          if (process.env.ENABLE_EMAIL === "false") {
            console.log(
              `[CRON] Email disabled, skipping reminder for appointment ${appt.id}`,
            );
            continue;
          }

          // Determine email recipient (use override or patient email)
          const recipientEmail =
            process.env.EMAIL_TO || appt.patient_email;

          await emailService.send({
            to: recipientEmail,
            subject: "Lembrete: Consulta amanhã - MediLux",
            html: getAppointmentReminderHtml({
              patientName: appt.patient_name,
              doctorName: appt.professional_name,
              date: appt.date,
              time: appt.time,
              type: appt.type,
            }),
          });

          // Mark as reminded
          await database.run(
            "UPDATE appointments SET reminded_at = CURRENT_TIMESTAMP WHERE id = ?",
            [appt.id],
          );

          successCount++;
          console.log(
            `✅ Reminder sent for appointment ${appt.id} (${appt.patient_name} at ${appt.time})`,
          );
        } catch (err: any) {
          failCount++;
          console.error(
            `❌ Failed to send reminder for appointment ${appt.id}:`,
            err.message,
          );
        }
      }

      console.log(
        `[CRON] Reminder job completed: ${successCount} sent, ${failCount} failed`,
      );
    } catch (error: any) {
      console.error("[CRON] Reminder job error:", error.message);
    }
  });

  console.log("✅ Appointment reminder job scheduled (daily at 9:00 AM)");
}
