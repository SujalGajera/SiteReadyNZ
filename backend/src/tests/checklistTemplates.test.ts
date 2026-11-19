import { buildChecklist } from '../utils/checklistTemplates';
import { EQUIPMENT_TYPES } from '../models/Equipment';

describe('buildChecklist', () => {
  it('has a checklist for every kind of equipment', () => {
    for (const type of EQUIPMENT_TYPES) {
      expect(buildChecklist(type).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('asks 7 questions for a fire extinguisher, 6 for first aid and AED, 4 for a sign', () => {
    expect(buildChecklist('fire_extinguisher')).toHaveLength(7);
    expect(buildChecklist('first_aid')).toHaveLength(6);
    expect(buildChecklist('aed')).toHaveLength(6);
    expect(buildChecklist('safety_sign')).toHaveLength(4);
  });

  it('starts every question unanswered with empty notes', () => {
    for (const item of buildChecklist('aed')) {
      expect(item.result).toBe('not_checked');
      expect(item.notes).toBe('');
    }
  });

  it('gives every question an id, a category and a severity, and never repeats an id', () => {
    for (const type of EQUIPMENT_TYPES) {
      const items = buildChecklist(type);
      const ids = items.map((item) => item.itemId);
      expect(new Set(ids).size).toBe(ids.length);
      for (const item of items) {
        expect(item.itemId).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect(['low', 'medium', 'critical']).toContain(item.severity);
      }
    }
  });

  it('marks the things that matter in an emergency as critical (pressure gauge, AED battery)', () => {
    expect(buildChecklist('fire_extinguisher').find((item) => item.itemId === 'fe-gauge')?.severity).toBe('critical');
    expect(buildChecklist('aed').find((item) => item.itemId === 'aed-battery')?.severity).toBe('critical');
  });

  it('returns a fresh copy each time, so one inspection can never change another', () => {
    const first = buildChecklist('first_aid');
    first[0].notes = 'edited';
    expect(buildChecklist('first_aid')[0].notes).toBe('');
  });
});
