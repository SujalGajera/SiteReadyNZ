import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadinessHero } from '@/components/equipment/ReadinessHero';
import type { EquipmentCounts } from '@/hooks/useEquipmentFilters';

const counts = (overrides: Partial<EquipmentCounts> = {}): EquipmentCounts => ({ total: 10, ok: 6, due_soon: 2, overdue: 1, expired: 1, ...overrides });

describe('ReadinessHero', () => {
  it('shows the readiness percentage (6 of 10 ready = 60)', async () => {
    render(<ReadinessHero counts={counts()} activeFilter="all" onSelect={jest.fn()} />);
    // The number counts up, so wait for the end value
    expect(await screen.findByText('60')).toBeInTheDocument();
  });

  it('shows how many items are in each state in the legend', () => {
    render(<ReadinessHero counts={counts()} activeFilter="all" onSelect={jest.fn()} />);
    // Each legend button holds a count and a label, in separate spans
    const legend = screen.getAllByRole('button').map((button) => button.textContent);
    expect(legend).toEqual(['6Ready', '2Due soon', '1Check overdue', '1Expired']);
  });

  it('turns the legend into a filter: tapping "Expired" selects it', async () => {
    const onSelect = jest.fn();
    render(<ReadinessHero counts={counts()} activeFilter="all" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /Expired/ }));
    expect(onSelect).toHaveBeenCalledWith('expired');
  });

  it('tapping the active filter again clears it', async () => {
    const onSelect = jest.fn();
    render(<ReadinessHero counts={counts()} activeFilter="due_soon" onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: /Due soon/ });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('all');
  });

  it.each([
    [counts({ total: 0, ok: 0, due_soon: 0, overdue: 0, expired: 0 }), 'Add your first item'],
    [counts({ total: 4, ok: 4, due_soon: 0, overdue: 0, expired: 0 }), 'Everything is in date and checked.'],
    [counts({ total: 5, ok: 3, due_soon: 2, overdue: 0, expired: 0 }), '2 items expire within 30 days.'],
    [counts({ total: 5, ok: 3, due_soon: 0, overdue: 1, expired: 1 }), '2 items need action now.'],
    [counts({ total: 3, ok: 2, due_soon: 0, overdue: 0, expired: 1 }), '1 item needs action now.'],
  ])('gives one plain sentence the manager can act on (%#)', (data, sentence) => {
    render(<ReadinessHero counts={data} activeFilter="all" onSelect={jest.fn()} />);
    expect(screen.getAllByText(new RegExp(sentence.replace('.', '\\.'))).length).toBeGreaterThan(0);
  });

  it('describes the bar for screen readers', () => {
    render(<ReadinessHero counts={counts()} activeFilter="all" onSelect={jest.fn()} />);
    const section = screen.getByRole('region', { name: 'Site readiness' });
    expect(within(section).getByRole('img', { name: '60% of items are ready' })).toBeInTheDocument();
  });

  it('shows 0% instead of crashing when there is no equipment', () => {
    render(<ReadinessHero counts={counts({ total: 0, ok: 0, due_soon: 0, overdue: 0, expired: 0 })} activeFilter="all" onSelect={jest.fn()} />);
    expect(screen.getByRole('img', { name: '0% of items are ready' })).toBeInTheDocument();
  });
});
