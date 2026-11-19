import {
  calculateEquipmentStatus,
  daysUntilInspectionDue,
  equipmentTypeCodes,
  equipmentTypeLabels,
  INSPECTION_INTERVAL_DAYS,
  standardStatusStrategy,
  statusDisplay,
  type StatusStrategy,
} from '@/utils/statusCalculator';
import type { EquipmentType } from '@/types';

// Same fixed "today" and same rules as the backend tests: the two copies of the rule must agree
const NOW = new Date(2026, 10, 17, 10, 30);
const DAY_MS = 24 * 60 * 60 * 1000;
const at = (isoDay: string) => `${isoDay}T00:00:00.000Z`;
const checkedDaysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS).toISOString();
const fresh = checkedDaysAgo(1);

describe('calculateEquipmentStatus (must match the server)', () => {
  it.each([
    ['2027-03-01', 'ok'],
    ['2026-12-18', 'ok'], // 31 days away
    ['2026-12-17', 'due_soon'], // 30 days away
    ['2026-11-17', 'due_soon'], // expires today, not yet expired
    ['2026-11-16', 'expired'], // yesterday
  ])('a first-aid kit expiring %s is "%s"', (expiryDay, expected) => {
    expect(calculateEquipmentStatus({ type: 'first_aid', expiryDate: at(expiryDay), lastInspectedAt: fresh }, undefined, NOW)).toBe(expected);
  });

  it('is "overdue" when the routine check is late (31 days, limit 30)', () => {
    expect(calculateEquipmentStatus({ type: 'fire_extinguisher', expiryDate: at('2027-06-01'), lastInspectedAt: checkedDaysAgo(31) }, undefined, NOW)).toBe('overdue');
  });

  it('is not overdue on exactly day 30', () => {
    expect(calculateEquipmentStatus({ type: 'fire_extinguisher', expiryDate: at('2027-06-01'), lastInspectedAt: checkedDaysAgo(30) }, undefined, NOW)).toBe('ok');
  });

  it('lets a sign go 90 days between checks but an AED only 30', () => {
    const base = { expiryDate: at('2027-06-01'), lastInspectedAt: checkedDaysAgo(60) };
    expect(calculateEquipmentStatus({ type: 'safety_sign', ...base }, undefined, NOW)).toBe('ok');
    expect(calculateEquipmentStatus({ type: 'aed', ...base }, undefined, NOW)).toBe('overdue');
  });

  it('ranks expired above overdue above due soon', () => {
    expect(calculateEquipmentStatus({ type: 'aed', expiryDate: at('2026-11-01'), lastInspectedAt: checkedDaysAgo(90) }, undefined, NOW)).toBe('expired');
    expect(calculateEquipmentStatus({ type: 'aed', expiryDate: at('2026-12-01'), lastInspectedAt: checkedDaysAgo(40) }, undefined, NOW)).toBe('overdue');
  });

  it('accepts a different rule (Strategy pattern)', () => {
    const neverReady: StatusStrategy = () => 'due_soon';
    expect(calculateEquipmentStatus({ type: 'aed', expiryDate: at('2030-01-01'), lastInspectedAt: fresh }, neverReady, NOW)).toBe('due_soon');
  });
});

describe('standardStatusStrategy', () => {
  it('decides from the two measurements alone', () => {
    expect(standardStatusStrategy({ daysUntilExpiry: 100, daysUntilInspectionDue: 10 })).toBe('ok');
    expect(standardStatusStrategy({ daysUntilExpiry: -1, daysUntilInspectionDue: -50 })).toBe('expired');
    expect(standardStatusStrategy({ daysUntilExpiry: 10, daysUntilInspectionDue: -1 })).toBe('overdue');
    expect(standardStatusStrategy({ daysUntilExpiry: 10, daysUntilInspectionDue: 5 })).toBe('due_soon');
  });
});

describe('daysUntilInspectionDue', () => {
  it('counts down from the last check using the interval for that kind of item', () => {
    expect(daysUntilInspectionDue({ type: 'fire_extinguisher', expiryDate: at('2027-01-01'), lastInspectedAt: checkedDaysAgo(12) }, NOW)).toBe(18);
    expect(daysUntilInspectionDue({ type: 'safety_sign', expiryDate: at('2027-01-01'), lastInspectedAt: checkedDaysAgo(12) }, NOW)).toBe(78);
  });
  it('starts the clock when the item was added if it has never been checked', () => {
    expect(daysUntilInspectionDue({ type: 'aed', expiryDate: at('2027-01-01'), createdAt: checkedDaysAgo(4) }, NOW)).toBe(26);
  });
  it('has an interval for every kind of equipment', () => {
    for (const type of Object.keys(equipmentTypeLabels) as EquipmentType[]) expect(INSPECTION_INTERVAL_DAYS[type]).toBeGreaterThan(0);
  });
});

describe('labels', () => {
  it('orders statuses from most to least urgent', () => {
    const order = Object.entries(statusDisplay).sort((a, b) => a[1].severity - b[1].severity).map(([status]) => status);
    expect(order).toEqual(['expired', 'overdue', 'due_soon', 'ok']);
  });
  it('has a short, unique code for each kind of equipment (used on the row tile)', () => {
    const codes = Object.values(equipmentTypeCodes);
    expect(new Set(codes).size).toBe(codes.length);
    expect(equipmentTypeCodes.fire_extinguisher).toBe('FE');
  });
});
