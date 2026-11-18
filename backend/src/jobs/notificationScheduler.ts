// src/jobs/notificationScheduler.ts — Runs the notification sweep on a timer.
// A plain setInterval is enough for one server. With several servers you would run this in one
// place only (or use a job queue), otherwise each server would sweep; the "sent" markers on each
// inspection still stop people being notified twice.

import { runNotificationSweep } from '../services/notificationService';

const DEFAULT_INTERVAL_MINUTES = 15;

/** Starts the timer. Returns a function that stops it (used when shutting down and in tests). */
export function startNotificationScheduler(): () => void {
  const minutes = Number(process.env.NOTIFICATION_SWEEP_MINUTES) || DEFAULT_INTERVAL_MINUTES;

  async function sweep() {
    try {
      const result = await runNotificationSweep();
      if (result.reminders > 0 || result.lateAlerts > 0) {
        console.log(`🔔 Notifications sent: ${result.reminders} reminder(s), ${result.lateAlerts} late alert(s)`);
      }
    } catch (error) {
      // A failed sweep must never crash the server. It simply tries again next time.
      console.error('Notification sweep failed:', error);
    }
  }

  void sweep(); // once at start, so a restart does not delay reminders by 15 minutes
  const timer = setInterval(() => void sweep(), minutes * 60 * 1000);
  console.log(`🔔 Notification checks run every ${minutes} minutes`);
  return () => clearInterval(timer);
}
