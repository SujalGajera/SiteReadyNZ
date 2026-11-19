import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SubmitPanel } from '@/components/inspection/SubmitPanel';
import { OutboxList } from '@/components/inspection/OutboxList';
import { InspectionCard } from '@/components/inspection/InspectionCard';
import { useOffline } from '@/context/OfflineContext';
import { useSync } from '@/hooks/useSync';
import type { Inspection, OutboxEntry } from '@/types';

jest.mock('@/context/OfflineContext');
jest.mock('@/hooks/useSync');

const inspection = {
  _id: 'insp-1',
  equipmentId: { _id: 'eq-1', name: 'AED, main hall', type: 'aed', location: 'Main hall entrance' },
  assignedStaffId: 'staff-1',
  scheduledDate: '2026-11-20T00:00:00.000Z',
  completedAt: null,
  status: 'pending',
  syncStatus: 'synced',
  items: [{ itemId: 'a' }, { itemId: 'b' }, { itemId: 'c' }, { itemId: 'd' }],
} as unknown as Inspection;

const online = (isOnline: boolean) => jest.mocked(useOffline).mockReturnValue({ isOnline });

describe('SubmitPanel', () => {
  const baseProps = { inspection, answered: 2, total: 4, blocker: '2 items still need an answer', lastSavedAt: null, isSubmitting: false, onSubmit: jest.fn() };

  it('shows progress as words, a percentage and an accessible progress bar', () => {
    online(true);
    render(<SubmitPanel {...baseProps} />);
    expect(screen.getByText('2 of 4 answered')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Checklist progress' })).toHaveAttribute('aria-valuenow', '50');
  });

  it('blocks Submit and says exactly why', () => {
    online(true);
    render(<SubmitPanel {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Submit inspection' })).toBeDisabled();
    expect(screen.getByText('2 items still need an answer')).toBeInTheDocument();
  });

  it('enables Submit when nothing blocks it, and sends when pressed', async () => {
    online(true);
    const onSubmit = jest.fn();
    render(<SubmitPanel {...baseProps} answered={4} blocker={null} onSubmit={onSubmit} />);
    expect(screen.getByText('Ready to send.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit inspection' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('reassures the person that it will upload later when they are offline', () => {
    online(false);
    render(<SubmitPanel {...baseProps} answered={4} blocker={null} />);
    expect(screen.getByText('Ready. It will upload when you are back online.')).toBeInTheDocument();
  });

  it('cannot be pressed twice while it is sending', () => {
    online(true);
    render(<SubmitPanel {...baseProps} answered={4} blocker={null} isSubmitting />);
    expect(screen.getByRole('button', { name: /Submit inspection/ })).toBeDisabled();
  });

  it('shows 0% (not a divide-by-zero) for an empty checklist', () => {
    online(true);
    render(<SubmitPanel {...baseProps} answered={0} total={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('OutboxList (the "waiting to upload" card)', () => {
  const entry = (id: string, state: OutboxEntry['state'], extra: Partial<OutboxEntry> = {}): OutboxEntry => ({
    submissionId: id, inspectionId: 'i', userId: 'u', equipmentName: `Item ${id}`, completedAt: '2026-11-17T01:15:00.000Z', items: [], state, ...extra,
  });
  const sync = (waiting: OutboxEntry[], failed: OutboxEntry[] = []) => {
    const value = { waiting, failed, isUploading: false, submit: jest.fn(), uploadNow: jest.fn(), discard: jest.fn() };
    jest.mocked(useSync).mockReturnValue(value);
    return value;
  };

  it('shows nothing at all when there is nothing waiting', () => {
    online(true);
    sync([]);
    const { container } = render(<OutboxList />);
    expect(container).toBeEmptyDOMElement();
  });

  it('counts waiting checklists with the right singular and plural, and lists them', () => {
    online(false);
    sync([entry('1', 'waiting'), entry('2', 'waiting')]);
    render(<OutboxList />);
    expect(screen.getByText('2 inspections waiting to upload')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('says "1 inspection" (singular) for one', () => {
    online(false);
    sync([entry('1', 'waiting')]);
    render(<OutboxList />);
    expect(screen.getByText('1 inspection waiting to upload')).toBeInTheDocument();
  });

  it('reassures when offline and offers no Try-now button, which could not work', () => {
    online(false);
    sync([entry('1', 'waiting')]);
    render(<OutboxList />);
    expect(screen.getByText(/upload by themselves when you have signal/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try now' })).not.toBeInTheDocument();
  });

  it('offers Try now when online, and uploads when pressed', async () => {
    online(true);
    const value = sync([entry('1', 'waiting')]);
    render(<OutboxList />);
    await userEvent.click(screen.getByRole('button', { name: 'Try now' }));
    expect(value.uploadNow).toHaveBeenCalledTimes(1);
  });

  it('shows why the server refused a checklist, and lets the person dismiss it', async () => {
    online(true);
    const value = sync([], [entry('bad-1', 'failed', { error: 'This inspection has already been completed.' })]);
    render(<OutboxList />);
    expect(screen.getByRole('alert')).toHaveTextContent('Item bad-1 was not accepted');
    expect(screen.getByRole('alert')).toHaveTextContent('already been completed');
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(value.discard).toHaveBeenCalledWith('bad-1');
  });
});

describe('InspectionCard (a job on a staff member\'s list)', () => {
  const show = (draftAnswered?: number) =>
    render(
      <MemoryRouter>
        <ul>
          <InspectionCard inspection={inspection} draftAnswered={draftAnswered} />
        </ul>
      </MemoryRouter>
    );

  it('is one big link to the checklist', () => {
    show();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/inspections/insp-1');
    expect(link).toHaveTextContent('AED, main hall');
    expect(link).toHaveTextContent('Main hall entrance');
  });

  it('shows progress when part of the checklist was already answered on this phone', () => {
    show(3);
    expect(screen.getByText('3 of 4 answered')).toBeInTheDocument();
  });

  it('shows no progress text when nothing was answered yet', () => {
    show(0);
    expect(screen.queryByText(/answered/)).not.toBeInTheDocument();
  });
});
