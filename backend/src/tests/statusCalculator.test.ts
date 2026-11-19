import {
  calculateEquipmentStatus,
  daysUntilExpiry,
  daysUntilInspectionDue,
  DUE_SOON_WINDOW_DAYS,
  INSPECTION_INTERVAL_DAYS,
  standardStatusStrategy,
  type StatusStrategy,
} from '../utils/statusCalculator';

// "Today" is fixed so the tests give the same answer on any day and in any time zone
const NOW = new Date(2026, 10, 17, 10, 30); // 17 Nov 2026, local time
const DAY_MS = 24 * 60 * 60 * 1000;
const expiry = (isoDay: string) => new Date(`${isoDay}T00:00:00Z`); // how the date picker's value is stored
const checkedDaysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

describe('daysUntilExpiry', () => {
  it('counts whole calendar days, ignoring the time of day', () => {
    expect(daysUntilExpiry(expiry('2026-11-17'), NOW)).toBe(0);
    expect(daysUntilExpiry(expiry('2026-11-18'), NOW)).toBe(1);
    expect(daysUntilExpiry(expiry('2026-12-17'), NOW)).toBe(30);
  });

  it('is negative once the date has passed', () => {
    expect(daysUntilExpiry(expiry('2026-11-16'), NOW)).toBe(-1);
    expect(daysUntilExpiry(expiry('2026-11-07'), NOW)).toBe(-10);
  });

  it('gives the same answer late in the evening as in the morning', () => {
    const lateEvening = new Date(2026, 10, 17, 23, 59);
    expect(daysUntilExpiry(expiry('2026-11-18'), lateEvening)).toBe(1);
  });
});

describe('daysUntilInspectionDue', () => {
  it('uses a 30-day interval for extinguishers, first aid kits and AEDs, and 90 for signs', () => {
    expect(INSPECTION_INTERVAL_DAYS.fire_extinguisher).toBe(30);
    expect(INSPECTION_INTERVAL_DAYS.first_aid).toBe(30);
    expect(INSPECTION_INTERVAL_DAYS.aed).toBe(30);
    expect(INSPECTION_INTERVAL_DAYS.safety_sign).toBe(90);
  });

  it('counts down from the last check', () => {
    const input = { type: 'fire_extinguisher' as const, expiryDate: expiry('2027-06-01'), lastInspectedAt: checkedDaysAgo(10) };
    expect(daysUntilInspectionDue(input, NOW)).toBe(20);
  });

  it('counts from the day it was added when it has never been checked', () => {
    const input = { type: 'aed' as const, expiryDate: expiry('2027-06-01'), createdAt: checkedDaysAgo(5) };
    expect(daysUntilInspectionDue(input, NOW)).toBe(25);
  });
});

describe('calculateEquipmentStatus', () => {
  const fresh = { lastInspectedAt: checkedDaysAgo(1) }; // checked yesterday, so only the expiry date matters

  it('is "ok" when well in date and recently checked', () => {
    expect(calculateEquipmentStatus({ type: 'first_aid', expiryDate: expiry('2027-03-01'), ...fresh }, undefined, NOW)).toBe('ok');
  });

  it('is "due_soon" from 30 days before expiry, and still "ok" at 31', () => {
    expect(DUE_SOON_WINDOW_DAYS).toBe(30);
    expect(calculateEquipmentStatus({ type: 'first_aid', expiryDate: expiry('2026-12-17'), ...fresh }, undefined, NOW)).toBe('due_soon'); // day 30
    expect(calculateEquipmentStatus({ type: 'first_aid', expiryDate: expiry('2026-12-18'), ...fresh }, undefined, NOW)).toBe('ok'); // day 31
  });

  it('is still "due_soon" on the expiry day itself (it has not expired yet)', () => {
    expect(calculateEquipmentStatus({ type: 'aed', expiryDate: expiry('2026-11-17'), ...fresh }, undefined, NOW)).toBe('due_soon');
  });

  it('is "expired" the day after the expiry date', () => {
    expect(calculateEquipmentStatus({ type: 'aed', expiryDate: expiry('2026-11-16'), ...fresh }, undefined, NOW)).toBe('expired');
  });

  it('is "overdue" when in date but the routine check is late', () => {
    const lateCheck = { lastInspectedAt: checkedDaysAgo(31) }; // limit is 30 days
    expect(calculateEquipmentStatus({ type: 'fire_extinguisher', expiryDate: expiry('2027-06-01'), ...lateCheck }, undefined, NOW)).toBe('overdue');
  });

  it('is NOT overdue on exactly the 30th day since the last check', () => {
    const onTheLimit = { lastInspectedAt: checkedDaysAgo(30) };
    expect(calculateEquipmentStatus({ type: 'fire_extinguisher', expiryDate: expiry('2027-06-01'), ...onTheLimit }, undefined, NOW)).toBe('ok');
  });

  it('gives signs a longer rope: 45 days since the check is fine for a sign but late for an extinguisher', () => {
    const input = { expiryDate: expiry('2027-06-01'), lastInspectedAt: checkedDaysAgo(45) };
    expect(calculateEquipmentStatus({ type: 'safety_sign', ...input }, undefined, NOW)).toBe('ok');
    expect(calculateEquipmentStatus({ type: 'fire_extinguisher', ...input }, undefined, NOW)).toBe('overdue');
  });

  it('lets "expired" outrank "overdue" when both are true', () => {
    const input = { type: 'fire_extinguisher' as const, expiryDate: expiry('2026-11-01'), lastInspectedAt: checkedDaysAgo(90) };
    expect(calculateEquipmentStatus(input, undefined, NOW)).toBe('expired');
  });

  it('lets "overdue" outrank "due_soon" when both are true', () => {
    const input = { type: 'fire_extinguisher' as const, expiryDate: expiry('2026-12-01'), lastInspectedAt: checkedDaysAgo(40) };
    expect(calculateEquipmentStatus(input, undefined, NOW)).toBe('overdue');
  });

  it('treats a never-checked item as freshly checked on the day it was added', () => {
    const input = { type: 'fire_extinguisher' as const, expiryDate: expiry('2027-06-01'), createdAt: checkedDaysAgo(2) };
    expect(calculateEquipmentStatus(input, undefined, NOW)).toBe('ok');
  });
});

describe('Strategy pattern: the rule can be swapped without changing the calculator', () => {
  it('uses whatever strategy it is given', () => {
    const alwaysExpired: StatusStrategy = () => 'expired';
    const input = { type: 'aed' as const, expiryDate: expiry('2030-01-01'), lastInspectedAt: checkedDaysAgo(1) };
    expect(calculateEquipmentStatus(input, alwaysExpired, NOW)).toBe('expired');
  });

  it('can express a stricter 60-day warning window', () => {
    const sixtyDayWarning: StatusStrategy = (metrics) => (metrics.daysUntilExpiry < 0 ? 'expired' : metrics.daysUntilExpiry <= 60 ? 'due_soon' : 'ok');
    const fiftyDaysAway = { type: 'aed' as const, expiryDate: expiry('2027-01-06'), lastInspectedAt: checkedDaysAgo(1) };
    expect(calculateEquipmentStatus(fiftyDaysAway, standardStatusStrategy, NOW)).toBe('ok');
    expect(calculateEquipmentStatus(fiftyDaysAway, sixtyDayWarning, NOW)).toBe('due_soon');
  });
});
