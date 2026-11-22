import { act, renderHook, waitFor } from '@testing-library/react';
import { useEquipment } from '@/hooks/useEquipment';
import { useStaff } from '@/hooks/useStaff';
import * as equipmentApi from '@/services/equipmentApi';
import * as staffApi from '@/services/staffApi';
import type { Equipment, User } from '@/types';

jest.mock('@/services/equipmentApi');
jest.mock('@/services/staffApi');
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const equipmentService = jest.mocked(equipmentApi);
const staffService = jest.mocked(staffApi);

const aed = { _id: 'eq-1', name: 'AED, hall', type: 'aed', status: 'ok' } as unknown as Equipment;
const fireExtinguisher = { _id: 'eq-2', name: 'Extinguisher, kitchen', type: 'fire_extinguisher', status: 'ok' } as unknown as Equipment;

describe('useEquipment', () => {
  it('starts loading, then holds the list from the server', async () => {
    equipmentService.fetchEquipment.mockResolvedValue([aed, fireExtinguisher]);
    const { result } = renderHook(() => useEquipment());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.equipment).toEqual([aed, fireExtinguisher]);
    expect(result.current.loadError).toBeNull();
  });

  it('shows a plain message when the list cannot be loaded', async () => {
    equipmentService.fetchEquipment.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useEquipment());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe('Could not load the equipment list.');
    expect(result.current.equipment).toEqual([]);
  });

  it('adds, changes and removes items in the list without reloading', async () => {
    equipmentService.fetchEquipment.mockResolvedValue([aed]);
    const { result } = renderHook(() => useEquipment());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    equipmentService.createEquipment.mockResolvedValue(fireExtinguisher);
    await act(async () => {
      await result.current.addEquipment({} as never);
    });
    expect(result.current.equipment.map((item) => item._id)).toEqual(['eq-1', 'eq-2']);

    equipmentService.updateEquipment.mockResolvedValue({ ...aed, name: 'AED, reception' } as Equipment);
    await act(async () => {
      await result.current.changeEquipment('eq-1', {} as never);
    });
    expect(result.current.equipment[0].name).toBe('AED, reception');

    equipmentService.deleteEquipment.mockResolvedValue();
    await act(async () => {
      await result.current.removeEquipment('eq-1');
    });
    expect(equipmentService.deleteEquipment).toHaveBeenCalledWith('eq-1');
    expect(result.current.equipment.map((item) => item._id)).toEqual(['eq-2']);
  });

  it('does not fail when the page is closed before the server answers', async () => {
    let answer: (list: Equipment[]) => void = () => undefined;
    equipmentService.fetchEquipment.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { unmount } = renderHook(() => useEquipment());
    unmount();
    await act(async () => {
      answer([aed]);
    });
    expect(equipmentService.fetchEquipment).toHaveBeenCalledTimes(1);
  });
});

describe('useStaff', () => {
  const tane = { id: 'u-1', name: 'Tane Walker', email: 'tane@example.com', role: 'staff' } as unknown as User;
  const aroha = { id: 'u-2', name: 'Aroha Ngata', email: 'aroha@example.com', role: 'staff' } as unknown as User;

  it('loads the staff list', async () => {
    staffService.fetchStaff.mockResolvedValue([tane]);
    const { result } = renderHook(() => useStaff());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.staff).toEqual([tane]);
  });

  it('keeps the list alphabetical when a person is added, and closes the form', async () => {
    staffService.fetchStaff.mockResolvedValue([tane]);
    staffService.createStaff.mockResolvedValue(aroha);
    const { result } = renderHook(() => useStaff());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.openForm());
    expect(result.current.isFormOpen).toBe(true);
    await act(async () => {
      await result.current.addStaff({ name: 'Aroha Ngata', email: 'aroha@example.com', password: 'correct-horse-battery' });
    });
    expect(result.current.staff.map((person) => person.name)).toEqual(['Aroha Ngata', 'Tane Walker']);
    expect(result.current.isFormOpen).toBe(false);
  });

  it('shows a message when the list cannot be loaded', async () => {
    staffService.fetchStaff.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useStaff());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toEqual(expect.any(String));
  });
});
