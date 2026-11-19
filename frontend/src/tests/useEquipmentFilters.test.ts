import { act, renderHook } from '@testing-library/react';
import { countEquipment, readinessPercent, useEquipmentFilters } from '@/hooks/useEquipmentFilters';
import type { Equipment, EquipmentStatus, EquipmentType } from '@/types';

function item(name: string, status: EquipmentStatus, expiryDate: string, extra: Partial<Equipment> = {}): Equipment {
  return { _id: name, name, type: 'fire_extinguisher' as EquipmentType, location: 'Hall', expiryDate, status, ...extra };
}

const fleet: Equipment[] = [
  item('Extinguisher, reception', 'expired', '2026-11-07', { location: 'Reception', serialNumber: 'FE-100' }),
  item('AED, main hall', 'ok', '2027-05-01', { type: 'aed', location: 'Main hall', serialNumber: 'AED-7' }),
  item('First aid kit, kitchen', 'due_soon', '2026-11-29', { type: 'first_aid', location: 'Kitchen' }),
  item('Extinguisher, workshop', 'overdue', '2027-01-15', { location: 'Workshop' }),
  item('Exit sign, stairwell', 'ok', '2027-09-01', { type: 'safety_sign', location: 'Stairwell B' }),
];

describe('countEquipment and readinessPercent', () => {
  it('counts each status', () => {
    expect(countEquipment(fleet)).toEqual({ total: 5, ok: 2, due_soon: 1, overdue: 1, expired: 1 });
  });

  it('works out the share of items that are ready', () => {
    expect(readinessPercent(countEquipment(fleet))).toBe(40);
  });

  it('rounds to a whole number', () => {
    expect(readinessPercent({ total: 3, ok: 1, due_soon: 1, overdue: 1, expired: 0 })).toBe(33);
    expect(readinessPercent({ total: 3, ok: 2, due_soon: 1, overdue: 0, expired: 0 })).toBe(67);
  });

  it('is 0, not an error, for an empty list', () => {
    expect(readinessPercent(countEquipment([]))).toBe(0);
  });
});

describe('useEquipmentFilters', () => {
  const names = (list: Equipment[]) => list.map((entry) => entry.name);

  it('defaults to most urgent first: expired, then overdue, then due soon, then ready (by date)', () => {
    const { result } = renderHook(() => useEquipmentFilters(fleet));
    expect(names(result.current.visibleEquipment)).toEqual([
      'Extinguisher, reception',
      'Extinguisher, workshop',
      'First aid kit, kitchen',
      'AED, main hall',
      'Exit sign, stairwell',
    ]);
  });

  it('searches names, locations, serial numbers and the kind of equipment, ignoring capitals', () => {
    const { result } = renderHook(() => useEquipmentFilters(fleet));
    act(() => result.current.setSearch('KITCHEN'));
    expect(names(result.current.visibleEquipment)).toEqual(['First aid kit, kitchen']);
    act(() => result.current.setSearch('aed-7'));
    expect(names(result.current.visibleEquipment)).toEqual(['AED, main hall']);
    act(() => result.current.setSearch('fire extinguisher'));
    expect(result.current.visibleEquipment).toHaveLength(2);
  });

  it('ignores spaces around the search text', () => {
    const { result } = renderHook(() => useEquipmentFilters(fleet));
    act(() => result.current.setSearch('   workshop   '));
    expect(names(result.current.visibleEquipment)).toEqual(['Extinguisher, workshop']);
  });

  it('filters by status', () => {
    const { result } = renderHook(() => useEquipmentFilters(fleet));
    act(() => result.current.setStatusFilter('ok'));
    expect(names(result.current.visibleEquipment)).toEqual(['AED, main hall', 'Exit sign, stairwell']);
  });

  it('combines search and status filter', () => {
    const { result } = renderHook(() => useEquipmentFilters(fleet));
    act(() => {
      result.current.setStatusFilter('ok');
      result.current.setSearch('sign');
    });
    expect(names(result.current.visibleEquipment)).toEqual(['Exit sign, stairwell']);
  });

  it.each([
    ['expiry', ['Extinguisher, reception', 'First aid kit, kitchen', 'Extinguisher, workshop', 'AED, main hall', 'Exit sign, stairwell']],
    ['name', ['AED, main hall', 'Exit sign, stairwell', 'Extinguisher, reception', 'Extinguisher, workshop', 'First aid kit, kitchen']],
    ['location', ['First aid kit, kitchen', 'AED, main hall', 'Extinguisher, reception', 'Exit sign, stairwell', 'Extinguisher, workshop']], // Kitchen, Main hall, Reception, Stairwell B, Workshop
  ] as const)('sorts by %s', (option, expected) => {
    const { result } = renderHook(() => useEquipmentFilters(fleet));
    act(() => result.current.setSortOption(option));
    expect(names(result.current.visibleEquipment)).toEqual(expected);
  });

  it('does not change the list that was passed in', () => {
    const copy = [...fleet];
    const { result } = renderHook(() => useEquipmentFilters(copy));
    act(() => result.current.setSortOption('name'));
    expect(copy.map((entry) => entry.name)).toEqual(fleet.map((entry) => entry.name));
  });

  it('knows when filters are active, and clears them', () => {
    const { result } = renderHook(() => useEquipmentFilters(fleet));
    expect(result.current.hasActiveFilters).toBe(false);
    act(() => {
      result.current.setSearch('zzz');
      result.current.setStatusFilter('expired');
    });
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.visibleEquipment).toHaveLength(0);
    act(() => result.current.clearFilters());
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.visibleEquipment).toHaveLength(5);
  });
});
