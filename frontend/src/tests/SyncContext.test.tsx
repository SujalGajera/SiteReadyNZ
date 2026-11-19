import { act, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { SyncProvider } from '@/context/SyncContext';
import { useSync } from '@/hooks/useSync';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/context/OfflineContext';
import { addToOutbox, getOutboxFor, removeFromOutbox } from '@/services/offlineDb';
import { uploadOutbox } from '@/services/outboxUploader';
import { announceSync } from '@/services/syncEvents';
import type { OutboxEntry } from '@/types';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/hooks/useAuth');
jest.mock('@/context/OfflineContext');
jest.mock('@/services/outboxUploader');
jest.mock('@/services/offlineDb', () => ({
  addToOutbox: jest.fn().mockResolvedValue(undefined),
  getOutboxFor: jest.fn().mockResolvedValue([]),
  removeFromOutbox: jest.fn().mockResolvedValue(undefined),
}));

const entry = (id: string, state: OutboxEntry['state'] = 'waiting'): OutboxEntry => ({
  submissionId: id, inspectionId: 'insp-1', userId: 'user-1', equipmentName: 'AED, hall', completedAt: '2026-11-17T01:00:00.000Z', items: [], state,
});

/** Shows what the provider knows and has buttons for its actions */
function Probe({ toSubmit }: { toSubmit?: OutboxEntry }) {
  const { waiting, failed, isUploading, submit, uploadNow, discard } = useSync();
  return (
    <div>
      <p data-testid="counts">{`waiting=${waiting.length} failed=${failed.length} uploading=${isUploading}`}</p>
      <button onClick={() => toSubmit && void submit(toSubmit).then((outcome) => (document.title = outcome))}>submit</button>
      <button onClick={() => void uploadNow()}>upload now</button>
      <button onClick={() => void discard('bad-1')}>discard</button>
    </div>
  );
}
const counts = () => screen.getByTestId('counts').textContent;

function mount(online = true, toSubmit?: OutboxEntry) {
  jest.mocked(useOffline).mockReturnValue({ isOnline: online });
  return render(<SyncProvider><Probe toSubmit={toSubmit} /></SyncProvider>);
}

beforeEach(() => {
  jest.mocked(useAuth).mockReturnValue({ user: { id: 'user-1', name: 'Tane', email: 't@example.com', role: 'staff' } } as ReturnType<typeof useAuth>);
  jest.mocked(getOutboxFor).mockResolvedValue([]);
  jest.mocked(uploadOutbox).mockResolvedValue({ uploaded: 0, rejected: 0, waiting: 0 });
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
});

describe('SyncProvider', () => {
  it('splits what is on the phone into "waiting" and "failed" for the signed-in person', async () => {
    jest.mocked(getOutboxFor).mockResolvedValue([entry('w-1'), entry('w-2'), entry('bad-1', 'failed')]);
    mount(false); // offline, so nothing is uploaded yet
    await waitFor(() => expect(counts()).toBe('waiting=2 failed=1 uploading=false'));
    expect(getOutboxFor).toHaveBeenCalledWith('user-1');
  });

  it('uploads by itself when the phone is online and something is waiting', async () => {
    jest.mocked(getOutboxFor).mockResolvedValue([entry('w-1')]);
    mount(true);
    await waitFor(() => expect(uploadOutbox).toHaveBeenCalledTimes(1));
  });

  it('does not try to upload while offline', async () => {
    jest.mocked(getOutboxFor).mockResolvedValue([entry('w-1')]);
    mount(false);
    await waitFor(() => expect(counts()).toContain('waiting=1'));
    expect(uploadOutbox).not.toHaveBeenCalled();
  });

  it('does not try to upload when only refused (failed) checklists are left', async () => {
    jest.mocked(getOutboxFor).mockResolvedValue([entry('bad-1', 'failed')]);
    mount(true);
    await waitFor(() => expect(counts()).toContain('failed=1'));
    expect(uploadOutbox).not.toHaveBeenCalled();
  });

  it('submit: saves on the device FIRST, then uploads, and reports "uploaded" when it reached the server', async () => {
    jest.mocked(getOutboxFor).mockResolvedValue([]); // after the upload nothing is left
    mount(true, entry('s-1'));
    await act(async () => screen.getByText('submit').click());
    await waitFor(() => expect(document.title).toBe('uploaded'));
    const order = [jest.mocked(addToOutbox).mock.invocationCallOrder[0], jest.mocked(uploadOutbox).mock.invocationCallOrder[0]];
    expect(order[0]).toBeLessThan(order[1]); // saved before it was sent
  });

  it('submit: reports "saved-offline" when the entry is still on the phone after trying', async () => {
    jest.mocked(getOutboxFor).mockResolvedValue([entry('s-1')]); // still waiting after the upload attempt
    jest.mocked(uploadOutbox).mockResolvedValue({ uploaded: 0, rejected: 0, waiting: 1 });
    mount(true, entry('s-1'));
    await act(async () => screen.getByText('submit').click());
    await waitFor(() => expect(document.title).toBe('saved-offline'));
  });

  it('submit while offline: saves it and does not even try to upload', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    mount(false, entry('s-2'));
    await act(async () => screen.getByText('submit').click());
    await waitFor(() => expect(document.title).toBe('saved-offline'));
    expect(addToOutbox).toHaveBeenCalledWith(expect.objectContaining({ submissionId: 's-2' }));
    expect(uploadOutbox).not.toHaveBeenCalled();
  });

  it('tells the person with a message when checklists reached the server', async () => {
    jest.mocked(uploadOutbox).mockResolvedValue({ uploaded: 2, rejected: 0, waiting: 0 });
    mount(true);
    await act(async () => screen.getByText('upload now').click());
    expect(toast.success).toHaveBeenCalledWith('2 inspections uploaded', expect.any(Object));
  });

  it('says "Inspection uploaded" (singular) for one', async () => {
    jest.mocked(uploadOutbox).mockResolvedValue({ uploaded: 1, rejected: 0, waiting: 0 });
    mount(true);
    await act(async () => screen.getByText('upload now').click());
    expect(toast.success).toHaveBeenCalledWith('Inspection uploaded', expect.any(Object));
  });

  it('warns the person when the server refused something, and points them to the list', async () => {
    jest.mocked(uploadOutbox).mockResolvedValue({ uploaded: 0, rejected: 1, waiting: 0 });
    mount(true);
    await act(async () => screen.getByText('upload now').click());
    expect(toast.error).toHaveBeenCalledWith('One inspection could not be uploaded', expect.objectContaining({ description: expect.stringContaining('inspections list') }));
  });

  it('stays quiet when there was nothing to upload', async () => {
    mount(true);
    await act(async () => screen.getByText('upload now').click());
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('discard removes a refused checklist from the phone and refreshes the list', async () => {
    mount(false);
    await act(async () => screen.getByText('discard').click());
    expect(removeFromOutbox).toHaveBeenCalledWith('bad-1');
    await waitFor(() => expect(getOutboxFor).toHaveBeenCalledTimes(2));
  });

  it('refreshes when another part of the app reports that the outbox changed', async () => {
    mount(false);
    await waitFor(() => expect(getOutboxFor).toHaveBeenCalledTimes(1));
    jest.mocked(getOutboxFor).mockResolvedValue([entry('w-9')]);
    act(() => announceSync({ type: 'outbox-changed' }));
    await waitFor(() => expect(counts()).toContain('waiting=1'));
  });

  it('shows an empty outbox when nobody is signed in', async () => {
    jest.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
    mount(false);
    await waitFor(() => expect(counts()).toBe('waiting=0 failed=0 uploading=false'));
    expect(getOutboxFor).not.toHaveBeenCalled();
  });
});
