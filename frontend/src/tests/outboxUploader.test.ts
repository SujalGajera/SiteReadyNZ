import { uploadEntry, uploadOutbox } from '@/services/outboxUploader';
import { getAllOutbox, markOutboxFailed, removeFromOutbox } from '@/services/offlineDb';
import type { OutboxEntry } from '@/types';

jest.mock('@/services/offlineDb', () => ({
  getAllOutbox: jest.fn(),
  removeFromOutbox: jest.fn().mockResolvedValue(undefined),
  markOutboxFailed: jest.fn().mockResolvedValue(undefined),
}));

const entry = (id: string, completedAt = '2026-11-17T01:00:00.000Z', extra: Partial<OutboxEntry> = {}): OutboxEntry => ({
  submissionId: id,
  inspectionId: 'insp-1',
  userId: 'user-1',
  equipmentName: 'Extinguisher, hall',
  completedAt,
  items: [{ itemId: 'a', result: 'pass', notes: '' }],
  state: 'waiting',
  ...extra,
});

const answerWith = (status: number, body: object = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
const fetchMock = jest.fn();
beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('uploadEntry (every way an upload can end)', () => {
  it('uploaded: a 200 answer', async () => {
    fetchMock.mockResolvedValue(answerWith(200));
    expect(await uploadEntry(entry('s1'))).toEqual({ kind: 'uploaded' });
  });

  it('posts the checklist to the server with the login cookie and the repeat-protection id', async () => {
    fetchMock.mockResolvedValue(answerWith(200));
    await uploadEntry(entry('sub-77'));
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/api/inspections/submit');
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('include'); // the login lives in an httpOnly cookie
    expect(JSON.parse(options.body as string)).toMatchObject({ inspectionId: 'insp-1', submissionId: 'sub-77', completedAt: '2026-11-17T01:00:00.000Z' });
  });

  it('never sends who it belongs to, or the state: the server decides identity from the cookie', async () => {
    fetchMock.mockResolvedValue(answerWith(200));
    await uploadEntry(entry('s1'));
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent).not.toHaveProperty('userId');
    expect(sent).not.toHaveProperty('state');
  });

  it('queued (offline): the request never reached the server', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await uploadEntry(entry('s1'))).toEqual({ kind: 'queued', reason: 'offline' });
  });

  it('queued (signed out): a 401 means nobody is signed in right now', async () => {
    fetchMock.mockResolvedValue(answerWith(401));
    expect(await uploadEntry(entry('s1'))).toEqual({ kind: 'queued', reason: 'signed-out' });
  });

  it('queued (another account): a 403 means a different person is signed in on this phone', async () => {
    fetchMock.mockResolvedValue(answerWith(403));
    expect(await uploadEntry(entry('s1'))).toEqual({ kind: 'queued', reason: 'other-account' });
  });

  it.each([500, 502, 503, 429])('queued (server busy): a %i is temporary, so try again later', async (status) => {
    fetchMock.mockResolvedValue(answerWith(status));
    expect(await uploadEntry(entry('s1'))).toEqual({ kind: 'queued', reason: 'server-busy' });
  });

  it('rejected: a 409 or 400 will never work, and the server\'s reason is kept for the person to read', async () => {
    fetchMock.mockResolvedValue(answerWith(409, { error: 'This inspection has already been completed.' }));
    expect(await uploadEntry(entry('s1'))).toEqual({ kind: 'rejected', message: 'This inspection has already been completed.' });
  });

  it('rejected, with a plain default message when the server gave no reason', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => { throw new Error('not json'); } } as unknown as Response);
    expect(await uploadEntry(entry('s1'))).toEqual({ kind: 'rejected', message: 'The server could not accept this checklist.' });
  });
});

describe('uploadOutbox', () => {
  it('uploads waiting entries oldest first and removes each one only after it succeeded', async () => {
    jest.mocked(getAllOutbox).mockResolvedValue([entry('newer', '2026-11-17T03:00:00.000Z'), entry('older', '2026-11-17T01:00:00.000Z')]);
    fetchMock.mockResolvedValue(answerWith(200));
    const summary = await uploadOutbox();
    expect(summary).toEqual({ uploaded: 2, rejected: 0, waiting: 0 });
    expect(jest.mocked(removeFromOutbox).mock.calls.map((call) => call[0])).toEqual(['older', 'newer']);
  });

  it('skips entries already marked as failed', async () => {
    jest.mocked(getAllOutbox).mockResolvedValue([entry('bad', undefined, { state: 'failed', error: 'x' }), entry('good')]);
    fetchMock.mockResolvedValue(answerWith(200));
    await uploadOutbox();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops at the first sign of no signal instead of hammering a dead connection, and counts what is left', async () => {
    jest.mocked(getAllOutbox).mockResolvedValue([entry('1', '2026-11-17T01:00:00.000Z'), entry('2', '2026-11-17T02:00:00.000Z'), entry('3', '2026-11-17T03:00:00.000Z')]);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const summary = await uploadOutbox();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(summary).toEqual({ uploaded: 0, rejected: 0, waiting: 3 });
    expect(removeFromOutbox).not.toHaveBeenCalled();
  });

  it('marks a refused checklist as failed (so a person sees why) and keeps going with the rest', async () => {
    jest.mocked(getAllOutbox).mockResolvedValue([entry('refused', '2026-11-17T01:00:00.000Z'), entry('fine', '2026-11-17T02:00:00.000Z')]);
    fetchMock.mockResolvedValueOnce(answerWith(409, { error: 'Already completed.' })).mockResolvedValueOnce(answerWith(200));
    const summary = await uploadOutbox();
    expect(summary).toEqual({ uploaded: 1, rejected: 1, waiting: 0 });
    expect(markOutboxFailed).toHaveBeenCalledWith('refused', 'Already completed.');
    expect(removeFromOutbox).toHaveBeenCalledWith('fine');
  });

  it('leaves another person\'s checklist alone on a shared phone, and still uploads the signed-in person\'s', async () => {
    jest.mocked(getAllOutbox).mockResolvedValue([entry('theirs', '2026-11-17T01:00:00.000Z'), entry('mine', '2026-11-17T02:00:00.000Z')]);
    fetchMock.mockResolvedValueOnce(answerWith(403)).mockResolvedValueOnce(answerWith(200));
    const summary = await uploadOutbox();
    expect(summary).toEqual({ uploaded: 1, rejected: 0, waiting: 1 });
    expect(removeFromOutbox).toHaveBeenCalledTimes(1);
    expect(removeFromOutbox).toHaveBeenCalledWith('mine');
    expect(markOutboxFailed).not.toHaveBeenCalled();
  });

  it('does nothing when the outbox is empty', async () => {
    jest.mocked(getAllOutbox).mockResolvedValue([]);
    expect(await uploadOutbox()).toEqual({ uploaded: 0, rejected: 0, waiting: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
