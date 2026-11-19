import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/equipment/StatusBadge';
import type { EquipmentStatus } from '@/types';

describe('StatusBadge', () => {
  it.each<[EquipmentStatus, string]>([
    ['ok', 'Ready'],
    ['due_soon', 'Due soon'],
    ['overdue', 'Check overdue'],
    ['expired', 'Expired'],
  ])('shows the words "%s" -> "%s", so colour is never the only signal', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('is an uppercase pill with tight letter-spacing (AGENT_RULES)', () => {
    render(<StatusBadge status="ok" />);
    const badge = screen.getByText('Ready');
    expect(badge).toHaveClass('uppercase', 'rounded-full');
    expect(badge.className).toMatch(/tracking-/);
  });

  it('makes "Expired" the only solid-filled badge', () => {
    const { unmount } = render(<StatusBadge status="expired" />);
    expect(screen.getByText('Expired')).toHaveClass('bg-danger');
    unmount();
    render(<StatusBadge status="overdue" />);
    expect(screen.getByText('Check overdue')).not.toHaveClass('bg-danger');
    expect(screen.getByText('Check overdue')).toHaveClass('bg-overdue-soft');
  });

  it('uses a different colour family for each status', () => {
    const colours = (['ok', 'due_soon', 'overdue', 'expired'] as const).map((status) => {
      const { unmount, container } = render(<StatusBadge status={status} />);
      const classes = (container.firstChild as HTMLElement).className;
      unmount();
      return classes.split(' ').find((name) => name.startsWith('bg-'));
    });
    expect(new Set(colours).size).toBe(4);
  });

  it('accepts an extra class from its parent', () => {
    render(<StatusBadge status="ok" className="md:w-[118px]" />);
    expect(screen.getByText('Ready')).toHaveClass('md:w-[118px]');
  });
});
