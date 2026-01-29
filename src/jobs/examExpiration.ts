import cron from "node-cron";
import { database } from "../config/database.js";

/**
 * RN-12: Exam Request Expiration
 * Expire exam requests that have been in pending_payment status for >30 days
 * Runs daily at midnight
 */
export function startExamExpirationJob() {
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running exam expiration job...");

    try {
      const result = await database.run(
        `
        UPDATE exam_requests
        SET status = 'expired'
        WHERE status = 'pending_payment'
          AND julianday('now') - julianday(created_at) > 30
      `,
        [],
      );

      if (result.changes > 0) {
        console.log(`✅ Expired ${result.changes} exam request(s)`);
      } else {
        console.log("[CRON] No exam requests to expire");
      }
    } catch (error: any) {
      console.error("[CRON] Exam expiration job error:", error.message);
    }
  });

  console.log("✅ Exam expiration job scheduled (daily at midnight)");
}
