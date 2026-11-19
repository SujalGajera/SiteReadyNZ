import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCard } from '@/components/layout/NotificationCard';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { describeDue } from '@/components/inspection/InspectionCard';

jest.mock('@/hooks/usePushNotifications');
jest.mock('@/hooks/useAuth');

const turnOn = jest.fn();
const turnOff = jest.fn();
function showCardFor(state: 'on' | 'off' | 'denied' | 'unsupported' | null, role: 'manager' | 'staff' = 'staff') {
  jest.mocked(useAuth).mockReturnValue({ user: { id: 'u', name: 'N', email: 'e@example.com', role } } as ReturnType<typeof useAuth>);
  jest.mocked(usePushNotifications).mockReturnValue({ state, isWorking: false, turnOn, turnOff });
  render(<NotificationCard />);
}

describe('NotificationCard (the four honest states)', () => {
  it('offers to turn reminders on, and does it when asked', async () => {
    showCardFor('off');
    await userEvent.click(screen.getByRole('button', { name: 'Turn on reminders' }));
    expect(turnOn).toHaveBeenCalledTimes(1);
  });

  it('says reminders are on, and lets the person turn them off', async () => {
    showCardFor('on');
    expect(screen.getByText('Reminders are on')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    expect(turnOff).toHaveBeenCalledTimes(1);
  });

  it('explains how to fix it when the person blocked notifications, with no button that cannot work', () => {
    showCardFor('denied');
    expect(screen.getByText('Reminders are blocked')).toBeInTheDocument();
    expect(screen.getByText(/open this site.s settings in your browser/)).toBeInTheDocument();
    expect(screen.getByText(/works fine without them/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('explains plainly when the browser cannot do notifications (for example an iPhone before the app is on the Home Screen)', () => {
    showCardFor('unsupported');
    expect(screen.getByText('Reminders are not available here')).toBeInTheDocument();
    expect(screen.getByText(/Home Screen/)).toBeInTheDocument();
  });

  it('shows nothing until it has checked, so the wrong state never flashes', () => {
    showCardFor(null);
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument();
  });

  it('tells a manager they will hear about late checks, and staff that they will be reminded the day before', () => {
    showCardFor('off', 'manager');
    expect(screen.getByText(/more than a day late/)).toBeInTheDocument();
  });

  it('tells staff about the day-before reminder', () => {
    showCardFor('off', 'staff');
    expect(screen.getByText(/the day before a check is due/)).toBeInTheDocument();
  });
});

describe('describeDue (the wording on a staff member\'s job cards)', () => {
  const dayFromNow = (days: number) => {
    const date = new Date();
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + days)).toISOString();
  };

  it.each([
    [0, 'Due today'],
    [1, 'Due tomorrow'],
    [4, 'Due in 4 days'],
    [-1, '1 day overdue'],
    [-3, '3 days overdue'],
  ])('describes %i days from now as "%s"', (days, words) => {
    expect(describeDue(dayFromNow(days)).text).toBe(words);
  });

  it('colours overdue jobs differently from jobs that are merely due soon', () => {
    expect(describeDue(dayFromNow(-2)).tone).toContain('overdue');
    expect(describeDue(dayFromNow(0)).tone).toContain('kowhai');
  });
});
