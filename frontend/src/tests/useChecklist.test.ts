import { act, renderHook, waitFor } from '@testing-library/react';
import { describeBlocker, useChecklist } from '@/hooks/useChecklist';
import { deleteDraft, getDraft, saveDraft } from '@/services/offlineDb';
import type { ChecklistItem, Inspection } from '@/types';

// The on-device database is replaced with a fake, so these tests need no browser storage
jest.mock('@/services/offlineDb', () => ({
  getDraft: jest.fn().mockResolvedValue(undefined),
  saveDraft: jest.fn().mockResolvedValue(undefined),
  deleteDraft: jest.fn().mockResolvedValue(undefined),
}));

const question = (itemId: string): ChecklistItem => ({ itemId, description: `Question ${itemId}`, category: 'Working', severity: 'medium', result: 'not_checked' });
const items = [question('a'), question('b'), question('c')];
const inspection = { _id: 'insp-1', equipmentId: { _id: 'eq-1', name: 'Extinguisher, hall', type: 'fire_extinguisher', location: 'Hall' }, items } as unknown as Inspection;

describe('describeBlocker (what stops the Submit button)', () => {
  it('counts unanswered questions, with the right singular and plural', () => {
    expect(describeBlocker(items, {})).toBe('3 items still need an answer');
    expect(describeBlocker(items, { a: { result: 'pass', notes: '' }, b: { result: 'pass', notes: '' } })).toBe('1 item still needs an answer');
  });

  it('needs a note for every Fail and Flag, but not for Pass', () => {
    const answers = { a: { result: 'pass' as const, notes: '' }, b: { result: 'fail' as const, notes: '' }, c: { result: 'flag' as const, notes: '   ' } };
    expect(describeBlocker(items, answers)).toBe('Add a note to 2 failed or flagged items');
    expect(describeBlocker(items, { ...answers, c: { result: 'flag', notes: 'Faded' } })).toBe('Add a note to 1 failed or flagged item');
  });

  it('is null when everything is answered and every Fail has a note', () => {
    const answers = { a: { result: 'pass' as const, notes: '' }, b: { result: 'fail' as const, notes: 'Pin missing' }, c: { result: 'pass' as const, notes: '' } };
    expect(describeBlocker(items, answers)).toBeNull();
  });

  it('reports unanswered questions before missing notes', () => {
    expect(describeBlocker(items, { a: { result: 'fail', notes: '' } })).toBe('2 items still need an answer');
  });
});

describe('useChecklist', () => {
  it('starts with nothing answered and Submit blocked', async () => {
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    expect(result.current.answeredCount).toBe(0);
    expect(result.current.total).toBe(3);
    expect(result.current.blocker).toBe('3 items still need an answer');
    expect(result.current.buildEntry()).toBeNull();
  });

  it('tracks progress as answers are set', async () => {
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    act(() => result.current.setResult('a', 'pass'));
    act(() => result.current.setResult('b', 'fail'));
    expect(result.current.answeredCount).toBe(2);
  });

  it('keeps the note when the answer changes from Fail to Flag', async () => {
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    act(() => result.current.setResult('a', 'fail'));
    act(() => result.current.setNotes('a', 'Gauge in the red'));
    act(() => result.current.setResult('a', 'flag'));
    expect(result.current.answers.a).toEqual({ result: 'flag', notes: 'Gauge in the red' });
  });

  it('ignores a note for a question that has not been answered', async () => {
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    act(() => result.current.setNotes('a', 'stray text'));
    expect(result.current.answers.a).toBeUndefined();
  });

  it('builds the outbox entry once everything is answered: trimmed notes, every question, the owner, "waiting"', async () => {
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    act(() => {
      result.current.setResult('a', 'pass');
      result.current.setResult('b', 'fail');
      result.current.setResult('c', 'pass');
    });
    act(() => result.current.setNotes('b', '  Pin missing  '));
    const entry = result.current.buildEntry();
    expect(entry).toMatchObject({ inspectionId: 'insp-1', userId: 'user-1', equipmentName: 'Extinguisher, hall', state: 'waiting' });
    expect(entry?.items).toEqual([
      { itemId: 'a', result: 'pass', notes: '' },
      { itemId: 'b', result: 'fail', notes: 'Pin missing' },
      { itemId: 'c', result: 'pass', notes: '' },
    ]);
  });

  it('gives the same submission id if Submit is pressed twice, so the server can spot the repeat', async () => {
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    act(() => ['a', 'b', 'c'].forEach((id) => result.current.setResult(id, 'pass')));
    expect(result.current.buildEntry()?.submissionId).toBe(result.current.buildEntry()?.submissionId);
  });

  it('saves a draft on the device shortly after an answer changes', async () => {
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    act(() => result.current.setResult('a', 'pass'));
    await waitFor(() => expect(saveDraft).toHaveBeenCalled());
    const savedCalls = jest.mocked(saveDraft).mock.calls;
    expect(savedCalls[savedCalls.length - 1][0]).toMatchObject({ inspectionId: 'insp-1', userId: 'user-1', answers: { a: { result: 'pass', notes: '' } } });
  });

  it('brings back a saved draft when the screen opens', async () => {
    jest.mocked(getDraft).mockResolvedValueOnce({ inspectionId: 'insp-1', userId: 'user-1', updatedAt: '', answers: { a: { result: 'fail', notes: 'Hose cracked' } } });
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.answers.a).toEqual({ result: 'fail', notes: 'Hose cracked' }));
    expect(result.current.answeredCount).toBe(1);
  });

  it('deletes the draft once the checklist has been submitted', async () => {
    const { result } = renderHook(() => useChecklist(inspection, 'user-1'));
    await waitFor(() => expect(result.current.draftLoaded).toBe(true));
    await act(async () => result.current.clearDraft());
    expect(deleteDraft).toHaveBeenCalledWith('insp-1');
  });

  it('does nothing while the inspection has not loaded yet', () => {
    const { result } = renderHook(() => useChecklist(undefined, 'user-1'));
    expect(result.current.total).toBe(0);
    expect(result.current.buildEntry()).toBeNull();
    expect(getDraft).not.toHaveBeenCalled();
  });
});
