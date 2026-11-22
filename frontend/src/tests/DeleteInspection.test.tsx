import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { DeleteInspectionDialog } from '@/components/inspection/DeleteInspectionDialog';
import { ManagerInspectionLine } from '@/components/inspection/ManagerInspectionLine';
import { useInspectionBoard } from '@/hooks/useInspectionBoard';
import * as inspectionApi from '@/services/inspectionApi';
import * as equipmentApi from '@/services/equipmentApi';
import * as staffApi from '@/services/staffApi';
import type { Inspection } from '@/types';

jest.mock('@/services/inspectionApi');
jest.mock('@/services/equipmentApi');
jest.mock('@/services/staffApi');
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const inspectionService = jest.mocked(inspectionApi);

const makeInspection = (overrides: Partial<Inspection> = {}) =>
  ({
    _id: 'insp-1',
    equipmentId: { _id: 'eq-1', name: 'AED, main hall', type: 'aed', location: 'Main hall entrance' },
    assignedStaffId: { _id: 'staff-1', name: 'Tane Walker', email: 'tane@example.com' },
    scheduledDate: '2026-11-20T00:00:00.000Z',
    completedAt: null,
    status: 'pending',
    syncStatus: 'synced',
    items: [],
    ...overrides,
  }) as unknown as Inspection;

describe('DeleteInspectionDialog (deleting always asks first)', () => {
  it('is hidden until a check is chosen', () => {
    render(<DeleteInspectionDialog inspection={null} isDeleting={false} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('names the equipment, and says finished checks are kept', () => {
    render(<DeleteInspectionDialog inspection={makeInspection()} isDeleting={false} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete the check for AED, main hall?');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('kept as a record');
  });

  it('has a red confirm button, and cancel does not confirm', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<DeleteInspectionDialog inspection={makeInspection()} isDeleting={false} onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: 'Delete check' })).toHaveClass('bg-destructive');
    await userEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('blocks both buttons while the delete is running, so it cannot be sent twice', () => {
    render(<DeleteInspectionDialog inspection={makeInspection()} isDeleting onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Delete check/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeDisabled();
  });
});

describe('ManagerInspectionLine', () => {
  it('offers Delete on a check that has not been done, and asks to delete THAT check', async () => {
    const onDelete = jest.fn();
    const open = makeInspection();
    render(
      <ul>
        <ManagerInspectionLine inspection={open} onDelete={onDelete} />
      </ul>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete the check for AED, main hall' }));
    expect(onDelete).toHaveBeenCalledWith(open);
  });

  it('shows no Delete button on a finished check, and summarises how it went', () => {
    const done = makeInspection({
      status: 'completed',
      completedAt: '2026-11-17T01:00:00.000Z',
      items: [{ result: 'pass' }, { result: 'pass' }, { result: 'fail' }] as unknown as Inspection['items'],
    });
    render(
      <ul>
        <ManagerInspectionLine inspection={done} onDelete={jest.fn()} />
      </ul>
    );
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.getByText('2 pass')).toBeInTheDocument();
    expect(screen.getByText('1 fail')).toBeInTheDocument();
  });

  it('shows the placeholder name for equipment that has since been deleted', () => {
    const history = makeInspection({
      status: 'completed',
      completedAt: '2026-11-17T01:00:00.000Z',
      equipmentId: { _id: '', name: 'Removed equipment', type: 'other', location: 'No longer in the equipment list' },
    });
    render(
      <ul>
        <ManagerInspectionLine inspection={history} onDelete={jest.fn()} />
      </ul>
    );
    expect(screen.getByText('Removed equipment')).toBeInTheDocument();
  });
});

describe('useInspectionBoard: deleting a check', () => {
  const first = makeInspection({ _id: 'insp-1' });
  const second = makeInspection({ _id: 'insp-2' });

  async function loadedBoard() {
    inspectionService.fetchAllInspections.mockResolvedValue([first, second]);
    jest.mocked(equipmentApi.fetchEquipment).mockResolvedValue([]);
    jest.mocked(staffApi.fetchStaff).mockResolvedValue([]);
    const hook = renderHook(() => useInspectionBoard());
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
    return hook;
  }

  it('asks first, and removes only the confirmed check from the list', async () => {
    const { result } = await loadedBoard();
    inspectionService.deleteInspection.mockResolvedValue();

    act(() => result.current.requestDelete(first));
    expect(result.current.inspectionToDelete).toBe(first);
    expect(inspectionService.deleteInspection).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(inspectionService.deleteInspection).toHaveBeenCalledWith('insp-1');
    expect(result.current.inspections.map((item) => item._id)).toEqual(['insp-2']);
    expect(result.current.inspectionToDelete).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('AED, main hall check deleted');
  });

  it('keeps the check in the list and tells the manager when the server refuses', async () => {
    const { result } = await loadedBoard();
    inspectionService.deleteInspection.mockRejectedValue(new Error('refused'));

    act(() => result.current.requestDelete(first));
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(result.current.inspections).toHaveLength(2);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(result.current.isDeleting).toBe(false);
  });

  it('cancelling closes the dialog and deletes nothing', async () => {
    const { result } = await loadedBoard();
    act(() => result.current.requestDelete(first));
    act(() => result.current.cancelDelete());
    expect(result.current.inspectionToDelete).toBeNull();
    expect(inspectionService.deleteInspection).not.toHaveBeenCalled();
  });
});
