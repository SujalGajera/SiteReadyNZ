import { daysUntil, describeDaysUntil, formatDate, lifeRemaining, toDateInputValue } from '@/utils/dateHelpers';

// "Now" is 17 Nov 2026, 10:30 in the device's own time zone
const NOW = new Date(2026, 10, 17, 10, 30);

describe('toDateInputValue', () => {
  it('turns the server\'s timestamp into the YYYY-MM-DD an input needs', () => {
    expect(toDateInputValue('2026-12-01T00:00:00.000Z')).toBe('2026-12-01');
  });
  it('gives an empty string for a missing date, so the input is simply blank', () => {
    expect(toDateInputValue(undefined)).toBe('');
    expect(toDateInputValue(null)).toBe('');
  });
});

describe('formatDate', () => {
  it('shows New Zealand style: day, short month, year', () => {
    expect(formatDate('2026-12-01T00:00:00.000Z')).toBe('1 Dec 2026');
  });
  it('shows the day that was picked, never the day before (dates are read in UTC)', () => {
    expect(formatDate('2026-03-01T00:00:00.000Z')).toBe('1 Mar 2026');
  });
  it('shows a dash when there is no date', () => {
    expect(formatDate(undefined)).toBe('\u2013');
    expect(formatDate(null)).toBe('\u2013');
  });
});

describe('daysUntil', () => {
  it('counts whole calendar days from today', () => {
    expect(daysUntil('2026-11-17T00:00:00.000Z', NOW)).toBe(0);
    expect(daysUntil('2026-11-18T00:00:00.000Z', NOW)).toBe(1);
    expect(daysUntil('2026-12-17T00:00:00.000Z', NOW)).toBe(30);
  });
  it('is negative for days that have passed', () => {
    expect(daysUntil('2026-11-07T00:00:00.000Z', NOW)).toBe(-10);
  });
  it('does not change during the day', () => {
    expect(daysUntil('2026-11-18T00:00:00.000Z', new Date(2026, 10, 17, 23, 59))).toBe(1);
  });
});

describe('describeDaysUntil', () => {
  it.each([
    ['2026-11-17T00:00:00.000Z', 'today'],
    ['2026-11-18T00:00:00.000Z', 'tomorrow'],
    ['2026-11-16T00:00:00.000Z', 'yesterday'],
    ['2026-11-29T00:00:00.000Z', 'in 12 days'],
    ['2026-11-07T00:00:00.000Z', '10 days ago'],
  ])('describes %s as "%s"', (date, words) => {
    expect(describeDaysUntil(date, NOW)).toBe(words);
  });
});

describe('lifeRemaining (the bar on each equipment row)', () => {
  const item = { purchaseDate: '2026-01-01T00:00:00.000Z', expiryDate: '2027-01-01T00:00:00.000Z' };

  it('is 1 on the day it was bought and 0 on the day it expires', () => {
    expect(lifeRemaining(item, new Date('2026-01-01T00:00:00.000Z'))).toBeCloseTo(1, 5);
    expect(lifeRemaining(item, new Date('2027-01-01T00:00:00.000Z'))).toBe(0);
  });

  it('is about half in the middle of its life', () => {
    expect(lifeRemaining(item, new Date('2026-07-02T12:00:00.000Z'))).toBeCloseTo(0.5, 1);
  });

  it('never goes below 0 after expiry or above 1 before purchase', () => {
    expect(lifeRemaining(item, new Date('2030-01-01'))).toBe(0);
    expect(lifeRemaining(item, new Date('2020-01-01'))).toBe(1);
  });

  it('falls back to the day it was added when there is no purchase date', () => {
    expect(lifeRemaining({ expiryDate: '2027-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' }, new Date('2026-07-02T12:00:00.000Z'))).toBeCloseTo(0.5, 1);
  });

  it('is 0 (not a division by zero) when the start is not before the expiry', () => {
    expect(lifeRemaining({ expiryDate: '2026-01-01T00:00:00.000Z', purchaseDate: '2026-01-01T00:00:00.000Z' }, NOW)).toBe(0);
  });
});
