// src/services/notificationService.ts — The two automatic notifications.
//
//   Staff reminder   an inspection is due today or tomorrow and not done  ->  the staff member
//   Manager alert    an inspection is more than 24 hours late             ->  the manager who assigned it
//
// A sweep looks for inspections that need either one. It runs on a timer (see jobs/) and can also be
// started by a manager (POST /api/push/run-checks). Each inspection is notified only once: the sweep
// writes a "sent" time on it, but only after a device really received the message, so someone who
// switches notifications on later still gets told.

import Inspection, { IInspection } from '../models/Inspection';
import Equipment from '../models/Equipment';
import User from '../models/User';
import { daysUntilExpiry as daysUntilDay } from '../utils/statusCalculator';
import { sendPushToUser } from './pushService';

/** A staff member is reminded when the due day is today (0) or tomorrow (1) */
export const REMINDER_WINDOW_DAYS = 1;
/** "More than 24 hours overdue": the due day is over, plus one more whole day */
export const OVERDUE_ALERT_AFTER_DAYS = 2;

export interface SweepResult {
  /** Reminders delivered to staff */
  reminders: number;
  /** Late alerts delivered to managers */
  lateAlerts: number;
}

export interface SweepOptions {
  /** Limit the sweep to one workspace (a manager pressing the button). Leave out for the timer. */
  organisationId?: string;
  now?: Date;
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Friendly names for the notification text, fetched in two queries instead of one per inspection */
async function loadNames(inspections: IInspection[]) {
  const equipment = await Equipment.find({ _id: { $in: inspections.map((i) => i.equipmentId) } }).select('name');
  const people = await User.find({ _id: { $in: inspections.map((i) => i.assignedStaffId) } }).select('name');
  return {
    equipmentName: new Map(equipment.map((item) => [String(item._id), item.name])),
    personName: new Map(people.map((person) => [String(person._id), person.name])),
  };
}

export async function runNotificationSweep(options: SweepOptions = {}): Promise<SweepResult> {
  const now = options.now ?? new Date();
  const scope = options.organisationId ? { organisationId: options.organisationId } : {};
  const result: SweepResult = { reminders: 0, lateAlerts: 0 };

  // Only jobs that are still open can need a nudge
  const open = await Inspection.find({ ...scope, status: { $in: ['pending', 'in_progress'] } });
  if (open.length === 0) return result;
  const names = await loadNames(open);

  for (const inspection of open) {
    const daysLeft = daysUntilDay(inspection.scheduledDate, now);
    const equipmentName = names.equipmentName.get(String(inspection.equipmentId)) ?? 'equipment';

    // ---- reminder for the staff member
    if (!inspection.reminderSentAt && daysLeft >= 0 && daysLeft <= REMINDER_WINDOW_DAYS) {
      const when = daysLeft === 0 ? 'today' : 'tomorrow';
      const sent = await sendPushToUser(String(inspection.assignedStaffId), {
        title: `Check due ${when}`,
        body: `${equipmentName} needs its inspection ${when}. It works offline.`,
        url: `/inspections/${inspection._id}`,
        tag: `due-${inspection._id}`,
      });
      if (sent.delivered > 0) {
        inspection.reminderSentAt = now;
        await inspection.save();
        result.reminders += 1;
      }
    }

    // ---- alert for the manager
    if (!inspection.overdueAlertSentAt && daysLeft <= -OVERDUE_ALERT_AFTER_DAYS) {
      const who = names.personName.get(String(inspection.assignedStaffId)) ?? 'A staff member';
      const sent = await sendPushToUser(String(inspection.assignedById), {
        title: 'Inspection is overdue',
        body: `${who} has not done the check on ${equipmentName} (due ${formatDay(inspection.scheduledDate)}).`,
        url: '/inspections',
        tag: `late-${inspection._id}`,
      });
      if (sent.delivered > 0) {
        inspection.overdueAlertSentAt = now;
        await inspection.save();
        result.lateAlerts += 1;
      }
    }
  }
  return result;
}
