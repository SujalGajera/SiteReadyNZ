import Inspection from '../models/Inspection';
import Equipment from '../models/Equipment';
import User from '../models/User';
import { sendPushToUser } from '../services/pushService';
import { runNotificationSweep } from '../services/notificationService';

jest.mock('../models/Inspection', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('../models/Equipment', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('../models/User', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('../services/pushService');

const inspectionModel = Inspection as unknown as { find: jest.Mock };
const equipmentModel = Equipment as unknown as { find: jest.Mock };
const userModel = User as unknown as { find: jest.Mock };
const send = sendPushToUser as jest.MockedFunction<typeof sendPushToUser>;

// "Now" is 17 Nov 2026. Due dates are stored as midnight UTC, like the date picker produces.
const NOW = new Date(2026, 10, 17, 9, 0);
const due = (isoDay: string) => new Date(`${isoDay}T00:00:00Z`);

function job(id: string, scheduledDate: Date, extra: Record<string, unknown> = {}) {
  return { _id: id, equipmentId: 'eq-1', assignedStaffId: 'staff-1', assignedById: 'manager-1', scheduledDate, save: jest.fn(), ...extra };
}

beforeEach(() => {
  equipmentModel.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'eq-1', name: 'AED, main hall' }]) });
  userModel.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'staff-1', name: 'Tane Walker' }]) });
  send.mockResolvedValue({ devices: 1, delivered: 1, removed: 0, failed: 0 });
});

describe('staff reminder (due today or tomorrow)', () => {
  it('sends "due tomorrow" to the staff member, linking to the checklist, and records that it was sent', async () => {
    const tomorrow = job('insp-1', due('2026-11-18'));
    inspectionModel.find.mockResolvedValue([tomorrow]);
    const result = await runNotificationSweep({ now: NOW });
    expect(result).toEqual({ reminders: 1, lateAlerts: 0 });
    expect(send).toHaveBeenCalledWith('staff-1', expect.objectContaining({ title: 'Check due tomorrow', url: '/inspections/insp-1' }));
    expect(send.mock.calls[0][1].body).toContain('AED, main hall');
    expect(tomorrow.save).toHaveBeenCalledTimes(1);
  });

  it('says "today" when it is due today', async () => {
    inspectionModel.find.mockResolvedValue([job('insp-1', due('2026-11-17'))]);
    await runNotificationSweep({ now: NOW });
    expect(send.mock.calls[0][1].title).toBe('Check due today');
  });

  it('stays quiet when the job is more than a day away', async () => {
    inspectionModel.find.mockResolvedValue([job('insp-1', due('2026-11-19'))]);
    expect(await runNotificationSweep({ now: NOW })).toEqual({ reminders: 0, lateAlerts: 0 });
    expect(send).not.toHaveBeenCalled();
  });

  it('never reminds twice', async () => {
    inspectionModel.find.mockResolvedValue([job('insp-1', due('2026-11-18'), { reminderSentAt: new Date() })]);
    await runNotificationSweep({ now: NOW });
    expect(send).not.toHaveBeenCalled();
  });

  it('does NOT mark it as sent when no device received it, so the person is still told once they turn notifications on', async () => {
    send.mockResolvedValue({ devices: 0, delivered: 0, removed: 0, failed: 0 });
    const tomorrow = job('insp-1', due('2026-11-18'));
    inspectionModel.find.mockResolvedValue([tomorrow]);
    expect(await runNotificationSweep({ now: NOW })).toEqual({ reminders: 0, lateAlerts: 0 });
    expect(tomorrow.save).not.toHaveBeenCalled();
  });
});

describe('manager alert (more than 24 hours late)', () => {
  it('is not sent the day after the due date (not yet a full day late)', async () => {
    inspectionModel.find.mockResolvedValue([job('insp-1', due('2026-11-16'))]);
    await runNotificationSweep({ now: NOW });
    expect(send).not.toHaveBeenCalled();
  });

  it('is sent once the job is more than a day late, to the manager who assigned it, naming the person and the equipment', async () => {
    const late = job('insp-1', due('2026-11-15'));
    inspectionModel.find.mockResolvedValue([late]);
    const result = await runNotificationSweep({ now: NOW });
    expect(result).toEqual({ reminders: 0, lateAlerts: 1 });
    expect(send).toHaveBeenCalledWith('manager-1', expect.objectContaining({ title: 'Inspection is overdue', url: '/inspections' }));
    const body = send.mock.calls[0][1].body;
    expect(body).toContain('Tane Walker');
    expect(body).toContain('AED, main hall');
    expect(late.save).toHaveBeenCalledTimes(1);
  });

  it('never alerts twice for the same job', async () => {
    inspectionModel.find.mockResolvedValue([job('insp-1', due('2026-11-10'), { overdueAlertSentAt: new Date() })]);
    await runNotificationSweep({ now: NOW });
    expect(send).not.toHaveBeenCalled();
  });
});

describe('scope and efficiency', () => {
  it('only looks at open jobs, so finished ones are never nagged about', async () => {
    inspectionModel.find.mockResolvedValue([]);
    await runNotificationSweep({ now: NOW });
    expect(inspectionModel.find).toHaveBeenCalledWith({ status: { $in: ['pending', 'in_progress'] } });
  });

  it('limits itself to one workspace when a manager runs it', async () => {
    inspectionModel.find.mockResolvedValue([]);
    await runNotificationSweep({ now: NOW, organisationId: 'org-1' });
    expect(inspectionModel.find).toHaveBeenCalledWith({ organisationId: 'org-1', status: { $in: ['pending', 'in_progress'] } });
  });

  it('fetches names in two queries however many jobs there are', async () => {
    inspectionModel.find.mockResolvedValue([job('1', due('2026-11-18')), job('2', due('2026-11-18')), job('3', due('2026-11-18'))]);
    await runNotificationSweep({ now: NOW });
    expect(equipmentModel.find).toHaveBeenCalledTimes(1);
    expect(userModel.find).toHaveBeenCalledTimes(1);
  });
});
